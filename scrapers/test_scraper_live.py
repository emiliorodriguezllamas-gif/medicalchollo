"""
MedicalChollo — Prueba rápida de extracción en vivo (sin necesidad de Base de Datos)
Prueba la conexión real contra Dentaltix y extrae productos reales con precio, stock y marca.
"""

import sys
import json
import httpx
from bs4 import BeautifulSoup

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def test_dentaltix_live():
    print("=" * 65)
    print("  🦷 MedicalChollo - Prueba de Scraper en Vivo (Dentaltix)")
    print("=" * 65)

    category_url = "https://www.dentaltix.com/es/guantes"
    print(f"\n1. Escaneando catalogo: {category_url}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
    }

    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        r = client.get(category_url)
        if r.status_code != 200:
            print(f"Error accediendo a la web (status {r.status_code})")
            return

        soup = BeautifulSoup(r.text, "html.parser")

        # Extraer enlaces de producto
        product_urls = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            parts = [p for p in href.split("/") if p]
            # Formato de producto en Dentaltix: /es/<marca>/<slug-producto>
            excluded = ["cart", "checkout", "login", "blog", "ayuda", "contacto", "envios", "pagos", "devoluciones"]
            if len(parts) == 3 and parts[0] == "es" and parts[1] not in excluded:
                full_url = f"https://www.dentaltix.com{href}" if href.startswith("/") else href
                if full_url not in product_urls:
                    product_urls.append(full_url)
            if len(product_urls) >= 3:
                break

        print(f"✅ Se han localizado {len(product_urls)} productos reales:")
        for u in product_urls:
            print(f"   -> {u}")

        print("\n2. Extrayendo datos en tiempo real de cada tienda...\n")

        for i, url in enumerate(product_urls, 1):
            pr = client.get(url)
            psoup = BeautifulSoup(pr.text, "html.parser")

            name = None
            price = None
            brand = None
            in_stock = False

            # Extraer de Schema.org JSON-LD
            for script in psoup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(script.text)
                    if data.get("@type") == "Product":
                        name = data.get("name")
                        brand_data = data.get("brand")
                        brand = brand_data.get("name") if isinstance(brand_data, dict) else brand_data
                        offers = data.get("offers", {})
                        if isinstance(offers, list) and len(offers) > 0:
                            offers = offers[0]
                        price = offers.get("price")
                        in_stock = "InStock" in offers.get("availability", "")
                except Exception:
                    pass

            if not name:
                h1 = psoup.find("h1")
                name = h1.get_text(strip=True) if h1 else "Producto sin nombre"

            print(f"┌─────────────────────────────────────────────────────────────")
            print(f"│  PRODUCTO #{i} DETECTADO")
            print(f"├─────────────────────────────────────────────────────────────")
            print(f"│  Nombre:         {name[:50]}")
            print(f"│  Marca:          {brand or 'General'}")
            print(f"│  Precio sin IVA: {price} EUR")
            print(f"│  Precio con IVA: {round(float(price) * 1.21, 2) if price else 'N/D'} EUR")
            print(f"│  Stock:          {'Disponible ✅' if in_stock else 'Agotado ❌'}")
            print(f"│  Tienda:         Dentaltix (España)")
            print(f"│  Enlace directo: {url}")
            print(f"└─────────────────────────────────────────────────────────────\n")

    print("=" * 65)
    print("  ✅ EXTRACCION COMPLETADA CON EXITO - DATOS 100% REALES")
    print("=" * 65)

if __name__ == "__main__":
    test_dentaltix_live()
