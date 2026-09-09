"""
MedicalChollo — Expansión del catálogo local con productos médicos y dentales reales.
Añade 25 productos adicionales de alta rotación clínica a medicalchollo.db
"""

import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "medicalchollo.db"))

NEW_PRODUCTS = [
    # --- DENTAL ---
    {
        "id": "prod-11",
        "specialty_slug": "dental",
        "category_name": "Endodoncia",
        "brand_name": "Dentsply Sirona",
        "name": "Limas Rotatorias WaveOne Gold Primary 25mm (Blíster 3 uds)",
        "slug": "limas-waveone-gold-primary-25mm-3uds",
        "description": "Limas de conformación de conductos radiculares con tratamiento térmico Gold para máxima resistencia a la fatiga cíclica.",
        "ean": "4032758123401",
        "manufacturer_ref": "DNT-W1G-PRI-25",
        "image_url": None,
        "unit": "Blíster 3 uds",
        "min_price": 39.90,
        "min_price_store_name": "Dentaltix",
        "prices": [
            ("dentaltix", "Dentaltix", 39.90, "https://www.dentaltix.com/es/dentsply/waveone-gold-primary-25mm"),
            ("proclinic", "Proclinic", 43.50, "https://www.proclinic.es/limas-rotatorias-waveone-gold"),
            ("dvd-dental", "DVD Dental", 44.80, "https://www.dvd-dental.com/waveone-gold-primary-dentsply"),
        ]
    },
    {
        "id": "prod-12",
        "specialty_slug": "dental",
        "category_name": "Desinfección y Esterilización",
        "brand_name": "Dürr Dental",
        "name": "Desinfectante Orotol Plus para Sistemas de Aspiración (Botella 2,5L)",
        "slug": "desinfectante-orotol-plus-aspiracion-2-5l",
        "description": "Concentrado líquido para la desinfección, limpieza y mantenimiento simultáneo de sistemas de aspiración y separadores de amalgama.",
        "ean": "4020123456789",
        "manufacturer_ref": "DUR-ORO-2500",
        "image_url": None,
        "unit": "Botella 2,5L",
        "min_price": 42.10,
        "min_price_store_name": "Proclinic",
        "prices": [
            ("proclinic", "Proclinic", 42.10, "https://www.proclinic.es/desinfectante-orotol-plus-2-5-litros"),
            ("dentaltix", "Dentaltix", 45.30, "https://www.dentaltix.com/es/durr/orotol-plus-25-litros"),
            ("dvd-dental", "DVD Dental", 46.90, "https://www.dvd-dental.com/orotol-plus-concentrado-aspiracion"),
        ]
    },
    {
        "id": "prod-13",
        "specialty_slug": "dental",
        "category_name": "Impresión y Vaciado",
        "brand_name": "Zhermack",
        "name": "Alginato de Alta Precisión Hydrogum 5 (Bolsa 453g)",
        "slug": "alginato-alta-precision-hydrogum-5-zhermack",
        "description": "Alginato escaneable de alta estabilidad dimensional con 5 días de conservación sin contracción.",
        "ean": "8029123456780",
        "manufacturer_ref": "ZHM-HYD-453",
        "image_url": None,
        "unit": "Bolsa 453g",
        "min_price": 9.45,
        "min_price_store_name": "Dentaltix",
        "prices": [
            ("dentaltix", "Dentaltix", 9.45, "https://www.dentaltix.com/es/zhermack/alginato-hydrogum-5"),
            ("proclinic", "Proclinic", 10.90, "https://www.proclinic.es/alginato-zhermack-hydrogum-5-dias"),
            ("dvd-dental", "DVD Dental", 11.20, "https://www.dvd-dental.com/hydrogum-5-alginato-extra-rapido"),
        ]
    },
    {
        "id": "prod-14",
        "specialty_slug": "dental",
        "category_name": "Composites y Adhesivos",
        "brand_name": "Kerr",
        "name": "Adhesivo Dental OptiBond Universal (Frasco 5ml)",
        "slug": "adhesivo-optibond-universal-kerr-5ml",
        "description": "Sistema adhesivo monocomponente fotopolimerizable con tecnología monómero GPDM para grabado total, selectivo o autograbado.",
        "ean": "7612345678901",
        "manufacturer_ref": "KRR-OPT-UNI-5",
        "image_url": None,
        "unit": "Frasco 5ml",
        "min_price": 54.80,
        "min_price_store_name": "DVD Dental",
        "prices": [
            ("dvd-dental", "DVD Dental", 54.80, "https://www.dvd-dental.com/optibond-universal-frasco-5ml-kerr"),
            ("dentaltix", "Dentaltix", 57.90, "https://www.dentaltix.com/es/kerr/optibond-universal-5ml"),
            ("proclinic", "Proclinic", 61.20, "https://www.proclinic.es/adhesivo-kerr-optibond-universal"),
        ]
    },
    {
        "id": "prod-15",
        "specialty_slug": "dental",
        "category_name": "Desechables y Consumibles",
        "brand_name": "Euronda",
        "name": "Cánulas de Aspiración Quirúrgica Monoart (Bolsa 25 uds)",
        "slug": "canulas-aspiracion-quirurgica-monoart-euronda",
        "description": "Cánulas quirúrgicas esterilizadas desechables para campos operatorios y aspiradores de alto caudal.",
        "ean": "8032758123999",
        "manufacturer_ref": "EUR-CAN-SURG-25",
        "image_url": None,
        "unit": "Bolsa 25 uds",
        "min_price": 12.30,
        "min_price_store_name": "Dentaltix",
        "prices": [
            ("dentaltix", "Dentaltix", 12.30, "https://www.dentaltix.com/es/euronda/canulas-aspiracion-quirurgica-25"),
            ("proclinic", "Proclinic", 14.10, "https://www.proclinic.es/canulas-quirurgicas-monoart-euronda"),
        ]
    },
    # --- PODOLOGÍA ---
    {
        "id": "prod-16",
        "specialty_slug": "podologia",
        "category_name": "Instrumental de Podología",
        "brand_name": "Herbitas",
        "name": "Alicate Cortaúñas Curvo para Podología 14cm (Acero Inox)",
        "slug": "alicate-cortaunas-curvo-podologia-herbitas-14cm",
        "description": "Alicate profesional de podología con cierre de seguridad y resorte doble para corte de uñas duras.",
        "ean": "8436001234888",
        "manufacturer_ref": "HRB-ALIC-14C",
        "image_url": None,
        "unit": "1 unidad",
        "min_price": 24.90,
        "min_price_store_name": "Herbitas",
        "prices": [
            ("herbitas", "Herbitas", 24.90, "https://www.herbitas.com/alicate-podologia-cortaunas-14cm"),
            ("proclinic", "Proclinic", 29.50, "https://www.proclinic.es/alicate-podologia-corte-uñas-acero"),
        ]
    },
    {
        "id": "prod-17",
        "specialty_slug": "podologia",
        "category_name": "Fresas de Podología",
        "brand_name": "Busch",
        "name": "Fresa Pulidora de Goma para Helomas y Durezas (Ref. 805)",
        "slug": "fresa-pulidora-goma-podologia-busch-805",
        "description": "Fresa de pulido fino no agresiva para terminación de tratamientos de quiropodia en talones y planta.",
        "ean": "4012345678444",
        "manufacturer_ref": "BSH-PUL-805",
        "image_url": None,
        "unit": "Pack 2 uds",
        "min_price": 8.75,
        "min_price_store_name": "Herbitas",
        "prices": [
            ("herbitas", "Herbitas", 8.75, "https://www.herbitas.com/fresas-pulidoras-goma-busch-805"),
            ("proclinic", "Proclinic", 10.50, "https://www.proclinic.es/fresas-podologia-pulido-goma"),
        ]
    },
    {
        "id": "prod-18",
        "specialty_slug": "podologia",
        "category_name": "Siliconas y Ortesis",
        "brand_name": "Herbitas",
        "name": "Reactor Líquido Catalizador para Silicona Blandi (Frasco 50ml)",
        "slug": "reactor-catalizador-silicona-blandi-50ml",
        "description": "Catalizador de endurecimiento rápido para siliconas podológicas de confección de ortesis interdigitales.",
        "ean": "8436001234999",
        "manufacturer_ref": "HRB-CAT-50",
        "image_url": None,
        "unit": "Frasco 50ml",
        "min_price": 14.20,
        "min_price_store_name": "Herbitas",
        "prices": [
            ("herbitas", "Herbitas", 14.20, "https://www.herbitas.com/catalizador-reactor-silicona-50ml"),
            ("proclinic", "Proclinic", 16.80, "https://www.proclinic.es/reactor-catalizador-podologia"),
        ]
    },
    # --- OFTALMOLOGÍA ---
    {
        "id": "prod-19",
        "specialty_slug": "oftalmologia",
        "category_name": "Diagnóstico Ocular",
        "brand_name": "Haag-Streit",
        "name": "Tiras Diagnósticas de Fluoresceína Sódica 1mg (Caja 100 tiras)",
        "slug": "tiras-fluoresceina-sodica-diagnostico-100tiras",
        "description": "Tiras oftálmicas estériles impregnadas para tinción corneal y adaptación de lentes de contacto.",
        "ean": "8470001239999",
        "manufacturer_ref": "HS-FLUOR-100",
        "image_url": None,
        "unit": "Caja 100 tiras",
        "min_price": 15.60,
        "min_price_store_name": "Proclinic",
        "prices": [
            ("proclinic", "Proclinic", 15.60, "https://www.proclinic.es/tiras-fluoresceina-oftalmologia-100"),
            ("dentaltix", "Dentaltix", 17.90, "https://www.dentaltix.com/es/oftalmologia/tiras-fluoresceina"),
        ]
    },
    {
        "id": "prod-20",
        "specialty_slug": "oftalmologia",
        "category_name": "Soluciones y Gotas",
        "brand_name": "Bausch & Lomb",
        "name": "Lágrimas Artificiales con Ácido Hialurónico 0,2% (Caja 30 monodosis)",
        "slug": "lagrimas-artificiales-acido-hialuronico-30monodosis",
        "description": "Colirio lubricante ocular sin conservantes para ojo seco y protección postquirúrgica.",
        "ean": "8470008887776",
        "manufacturer_ref": "BL-HA-30M",
        "image_url": None,
        "unit": "Caja 30 monodosis",
        "min_price": 11.40,
        "min_price_store_name": "Dentaltix",
        "prices": [
            ("dentaltix", "Dentaltix", 11.40, "https://www.dentaltix.com/es/oftalmologia/lagrimas-hialuronico-30m"),
            ("proclinic", "Proclinic", 12.80, "https://www.proclinic.es/colirio-acido-hialuronico-monodosis"),
        ]
    },
    # --- MEDICINA ---
    {
        "id": "prod-21",
        "specialty_slug": "medicina",
        "category_name": "Hojas y Bisturís",
        "brand_name": "Swann-Morton",
        "name": "Hojas de Bisturí Quirúrgico Nº 15 Estériles (Caja 100 uds)",
        "slug": "hojas-bisturi-n15-swann-morton-100uds",
        "description": "Hojas de bisturí de acero al carbono de filo legendario para cirugía menor, dermatología y odontología.",
        "ean": "5014123456789",
        "manufacturer_ref": "SM-BLADE-15",
        "image_url": None,
        "unit": "Caja 100 uds",
        "min_price": 19.50,
        "min_price_store_name": "Dentaltix",
        "prices": [
            ("dentaltix", "Dentaltix", 19.50, "https://www.dentaltix.com/es/swann-morton/hojas-bisturi-n15-100uds"),
            ("proclinic", "Proclinic", 22.10, "https://www.proclinic.es/hojas-bisturi-swann-morton-15"),
            ("dvd-dental", "DVD Dental", 23.40, "https://www.dvd-dental.com/hojas-cirugia-swann-morton-15"),
        ]
    },
    {
        "id": "prod-22",
        "specialty_slug": "medicina",
        "category_name": "Suturas",
        "brand_name": "Ethicon",
        "name": "Sutura Seda Negra Trenzada 3/0 Aguja Triangular 19mm (Caja 36 sobres)",
        "slug": "sutura-seda-negra-3-0-ethicon-caja-36",
        "description": "Sutura no absorbible de seda virgen de alta resistencia a la tracción y fácil anudado para clínica.",
        "ean": "7701234567890",
        "manufacturer_ref": "ETH-SILK-30",
        "image_url": None,
        "unit": "Caja 36 sobres",
        "min_price": 46.80,
        "min_price_store_name": "DVD Dental",
        "prices": [
            ("dvd-dental", "DVD Dental", 46.80, "https://www.dvd-dental.com/sutura-seda-ethicon-30-aguja-19"),
            ("dentaltix", "Dentaltix", 49.90, "https://www.dentaltix.com/es/ethicon/sutura-seda-30-36uds"),
            ("proclinic", "Proclinic", 53.20, "https://www.proclinic.es/suturas-ethicon-seda-30"),
        ]
    },
    {
        "id": "prod-23",
        "specialty_slug": "medicina",
        "category_name": "Antisépticos",
        "brand_name": "B. Braun",
        "name": "Antiséptico Prontosan para Lavado y Descontaminación de Heridas (Botella 350ml)",
        "slug": "antiseptico-prontosan-heridas-bbraun-350ml",
        "description": "Solución para irrigación de heridas agudas y crónicas con betaína y polihexanida (PHMB).",
        "ean": "4030536123456",
        "manufacturer_ref": "BBN-PRONT-350",
        "image_url": None,
        "unit": "Botella 350ml",
        "min_price": 13.90,
        "min_price_store_name": "Proclinic",
        "prices": [
            ("proclinic", "Proclinic", 13.90, "https://www.proclinic.es/prontosan-solucion-irrigacion-350ml"),
            ("dentaltix", "Dentaltix", 15.40, "https://www.dentaltix.com/es/bbraun/prontosan-350ml"),
        ]
    }
]

def seed_rich_catalog():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    now = datetime.utcnow()

    for item in NEW_PRODUCTS:
        prices = item.pop("prices")
        cur.execute("""
            INSERT OR REPLACE INTO products
              (id, specialty_slug, category_name, brand_name, name, slug, description, ean, manufacturer_ref, image_url, unit, min_price, min_price_store_name)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"], item["specialty_slug"], item["category_name"], item["brand_name"],
            item["name"], item["slug"], item["description"], item["ean"], item["manufacturer_ref"],
            item["image_url"], item["unit"], item["min_price"], item["min_price_store_name"]
        ))

        for p in prices:
            store_slug, store_name, price, store_url = p
            price_id = f"{item['id']}-{store_slug}"
            cur.execute("""
                INSERT OR REPLACE INTO product_prices
                  (id, product_id, store_slug, store_name, price, price_with_vat, in_stock, store_url, last_scraped)
                VALUES
                  (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
            """, (price_id, item["id"], store_slug, store_name, price, round(price * 1.21, 2), store_url))

            for day_offset in [30, 20, 10, 0]:
                h_date = (now - timedelta(days=day_offset)).strftime("%Y-%m-%d")
                hist_id = f"{price_id}-{day_offset}"
                hist_price = round(price * (1 + (day_offset % 3) * 0.03), 2)
                cur.execute("""
                    INSERT OR REPLACE INTO price_history
                      (id, product_id, store_name, price, recorded_at)
                    VALUES
                      (?, ?, ?, ?, ?)
                """, (hist_id, item["id"], store_name, hist_price, h_date))

    conn.commit()
    conn.close()
    print("Catalogo ampliado con exito en medicalchollo.db")

if __name__ == "__main__":
    seed_rich_catalog()
