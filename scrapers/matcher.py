"""
MedicalChollo — Motor de Matching de Productos
Asocia el mismo producto en distintas tiendas usando:
1. Código EAN (máxima fiabilidad)
2. Referencia del fabricante
3. Similitud de nombre con fuzzy matching (fallback)
"""

import re
import psycopg2
import psycopg2.extras
from typing import Optional
from fuzzywuzzy import fuzz
from loguru import logger
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


class ProductMatcher:
    """
    Motor de matching para asociar productos scrapeados con el catálogo maestro.
    
    Estrategia:
    1. Si el producto tiene EAN → buscar en catálogo por EAN (100% fiable)
    2. Si tiene referencia de fabricante → buscar por referencia
    3. Fuzzy matching por nombre (solo si score > umbral)
    4. Si no hay match → crear nuevo producto en el catálogo
    """

    FUZZY_THRESHOLD = 88  # Mínimo score para considerar un match (0-100)

    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)

    def find_or_create(
        self,
        name: str,
        ean: Optional[str] = None,
        manufacturer_ref: Optional[str] = None,
        brand: Optional[str] = None,
        specialty_slug: str = "dental",
        image_url: Optional[str] = None,
        unit: Optional[str] = None,
    ) -> Optional[str]:
        """
        Busca el producto en el catálogo maestro y lo devuelve.
        Si no existe y los datos son suficientemente confiables, lo crea.
        
        Devuelve el UUID del producto o None si no se pudo hacer match.
        """

        # ---- 1. Buscar por EAN ----
        if ean:
            product_id = self._find_by_ean(ean)
            if product_id:
                logger.debug(f"✅ Match por EAN ({ean}): {product_id}")
                return product_id

        # ---- 2. Buscar por referencia de fabricante ----
        if manufacturer_ref:
            product_id = self._find_by_manufacturer_ref(manufacturer_ref)
            if product_id:
                logger.debug(f"✅ Match por ref ({manufacturer_ref}): {product_id}")
                return product_id

        # ---- 3. Fuzzy matching por nombre ----
        product_id, score = self._fuzzy_match(name, specialty_slug)
        if product_id and score >= self.FUZZY_THRESHOLD:
            logger.debug(f"✅ Match fuzzy (score={score}%): {name[:50]}")
            # Actualizar EAN/ref si el producto maestro no los tenía
            if ean or manufacturer_ref:
                self._update_product_identifiers(product_id, ean, manufacturer_ref)
            return product_id

        # ---- 4. No hay match: crear nuevo producto ----
        # Solo creamos si tenemos datos suficientemente fiables
        if len(name.strip()) > 5 and (ean or manufacturer_ref or (brand and len(name) > 15)):
            product_id = self._create_product(
                name=name,
                ean=ean,
                manufacturer_ref=manufacturer_ref,
                brand=brand,
                specialty_slug=specialty_slug,
                image_url=image_url,
                unit=unit,
            )
            if product_id:
                logger.info(f"➕ Nuevo producto creado: {name[:60]}")
                return product_id

        logger.debug(f"⚠️  Sin match para: {name[:50]}")
        return None

    def _find_by_ean(self, ean: str) -> Optional[str]:
        """Busca un producto por código EAN exacto."""
        ean_clean = re.sub(r"\D", "", ean)
        if len(ean_clean) not in [8, 13]:
            return None

        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM products WHERE ean = %s AND is_active = TRUE LIMIT 1",
                (ean_clean,)
            )
            row = cur.fetchone()
            return str(row[0]) if row else None

    def _find_by_manufacturer_ref(self, ref: str) -> Optional[str]:
        """Busca un producto por referencia del fabricante."""
        ref_clean = ref.strip().upper()
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM products WHERE UPPER(manufacturer_ref) = %s AND is_active = TRUE LIMIT 1",
                (ref_clean,)
            )
            row = cur.fetchone()
            return str(row[0]) if row else None

    def _normalize_name(self, name: str) -> str:
        """Normaliza un nombre de producto para comparación."""
        import unicodedata
        # Quitar acentos
        name = unicodedata.normalize("NFD", name)
        name = "".join(c for c in name if unicodedata.category(c) != "Mn")
        # Minúsculas
        name = name.lower()
        # Quitar caracteres especiales (mantener letras, números y espacios)
        name = re.sub(r"[^\w\s]", " ", name)
        # Normalizar espacios
        name = re.sub(r"\s+", " ", name).strip()
        return name

    def _fuzzy_match(self, name: str, specialty_slug: str) -> tuple[Optional[str], int]:
        """
        Busca el mejor match fuzzy en el catálogo dentro de la misma especialidad.
        Devuelve (product_id, score) donde score es 0-100.
        """
        normalized_name = self._normalize_name(name)

        with self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Obtener candidatos de la misma especialidad (limitar búsqueda)
            cur.execute(
                """
                SELECT p.id, p.name
                FROM products p
                LEFT JOIN specialties s ON p.specialty_id = s.id
                WHERE p.is_active = TRUE
                  AND (s.slug = %s OR %s = 'any')
                LIMIT 5000
                """,
                (specialty_slug, specialty_slug)
            )
            candidates = cur.fetchall()

        best_id = None
        best_score = 0

        for candidate in candidates:
            candidate_normalized = self._normalize_name(candidate["name"])
            # Usar token_sort_ratio para mejor matching cuando el orden de palabras varía
            score = fuzz.token_sort_ratio(normalized_name, candidate_normalized)
            if score > best_score:
                best_score = score
                best_id = str(candidate["id"])

        return best_id, best_score

    def _create_product(
        self,
        name: str,
        ean: Optional[str],
        manufacturer_ref: Optional[str],
        brand: Optional[str],
        specialty_slug: str,
        image_url: Optional[str],
        unit: Optional[str],
    ) -> Optional[str]:
        """Crea un nuevo producto en el catálogo maestro."""
        import unicodedata

        # Generar slug
        slug_base = unicodedata.normalize("NFD", name.lower())
        slug_base = "".join(c for c in slug_base if unicodedata.category(c) != "Mn")
        slug_base = re.sub(r"[^\w\s-]", "", slug_base)
        slug_base = re.sub(r"[\s_-]+", "-", slug_base).strip("-")[:80]

        try:
            with self.conn.cursor() as cur:
                # Obtener specialty_id
                cur.execute("SELECT id FROM specialties WHERE slug = %s", (specialty_slug,))
                spec_row = cur.fetchone()
                specialty_id = spec_row[0] if spec_row else None

                # Obtener o crear brand_id
                brand_id = None
                if brand:
                    cur.execute("SELECT id FROM brands WHERE LOWER(name) = LOWER(%s)", (brand,))
                    brand_row = cur.fetchone()
                    if brand_row:
                        brand_id = brand_row[0]
                    else:
                        brand_slug = re.sub(r"[^\w-]", "-", brand.lower())
                        cur.execute(
                            "INSERT INTO brands (name, slug) VALUES (%s, %s) RETURNING id",
                            (brand, brand_slug)
                        )
                        brand_id = cur.fetchone()[0]

                # Generar slug único
                slug = slug_base
                suffix = 1
                while True:
                    cur.execute("SELECT 1 FROM products WHERE slug = %s", (slug,))
                    if not cur.fetchone():
                        break
                    slug = f"{slug_base}-{suffix}"
                    suffix += 1

                # Insertar producto
                cur.execute(
                    """
                    INSERT INTO products
                        (specialty_id, brand_id, name, slug, ean, manufacturer_ref,
                         image_url, unit, is_active)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                    RETURNING id
                    """,
                    (specialty_id, brand_id, name, slug, ean, manufacturer_ref, image_url, unit)
                )
                product_id = str(cur.fetchone()[0])
                self.conn.commit()
                return product_id

        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error creando producto '{name[:50]}': {e}")
            return None

    def _update_product_identifiers(
        self,
        product_id: str,
        ean: Optional[str],
        manufacturer_ref: Optional[str],
    ):
        """Actualiza EAN y referencia en un producto existente."""
        try:
            with self.conn.cursor() as cur:
                if ean:
                    cur.execute(
                        "UPDATE products SET ean = %s WHERE id = %s AND ean IS NULL",
                        (ean, product_id)
                    )
                if manufacturer_ref:
                    cur.execute(
                        "UPDATE products SET manufacturer_ref = %s WHERE id = %s AND manufacturer_ref IS NULL",
                        (manufacturer_ref, product_id)
                    )
                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            logger.warning(f"Error actualizando identificadores: {e}")

    def close(self):
        if self.conn and not self.conn.closed:
            self.conn.close()


if __name__ == "__main__":
    # Test de matching
    matcher = ProductMatcher()
    print("Matcher inicializado correctamente")
    matcher.close()
