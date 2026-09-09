"""
MedicalChollo — Scraper de Dentaltix.com
Extrae precios de la mayor tienda dental online de España.

Dentaltix tiene un catálogo público accesible sin login.
Los precios mostrados son sin IVA (para profesionales).
"""

import re
import asyncio
from typing import Optional
from loguru import logger
from playwright.async_api import Page
from base_scraper import BaseScraper, ScrapedProduct


class DentaltixScraper(BaseScraper):

    store_name = "Dentaltix"
    store_slug = "dentaltix"
    base_url = "https://www.dentaltix.com"

    # Categorías principales a rastrear
    CATEGORIES = [
        "/es/anestesia",
        "/es/guantes",
        "/es/composites-y-adhesivos",
        "/es/fresas-y-brocas",
        "/es/endodoncia",
        "/es/desechables-y-consumibles",
        "/es/higiene-oral",
        "/es/instrumental",
        "/es/radiologia-digital",
    ]

    async def get_category_urls(self) -> list[str]:
        """Devuelve las URLs de todas las categorías."""
        return [f"{self.base_url}{cat}" for cat in self.CATEGORIES]

    async def scrape_product_list(self, page: Page, category_url: str) -> list[str]:
        """
        Extrae URLs de todos los productos de una categoría.
        Itera por todas las páginas de la categoría.
        """
        product_urls = []
        current_url = category_url

        while True:
            try:
                # Extraer URLs de producto de la página actual
                # Los productos en Dentaltix suelen estar en <a> dentro de .product-item
                links = await page.query_selector_all("a.product-item-link, .product-name a, .product_title a")

                for link in links:
                    href = await link.get_attribute("href")
                    if href and "/es/" in href and href not in product_urls:
                        if not href.startswith("http"):
                            href = self.base_url + href
                        product_urls.append(href)

                # Buscar botón "Siguiente página"
                next_button = await page.query_selector("a.next, a[aria-label='Siguiente'], .pages-item-next a")
                if next_button:
                    next_url = await next_button.get_attribute("href")
                    if next_url and next_url != current_url:
                        current_url = next_url
                        await page.goto(current_url, wait_until="domcontentloaded", timeout=30000)
                        await asyncio.sleep(1.5)
                    else:
                        break
                else:
                    break

            except Exception as e:
                logger.warning(f"Error extrayendo lista de productos: {e}")
                break

        logger.info(f"  Encontradas {len(product_urls)} URLs en {category_url}")
        return list(set(product_urls))  # Eliminar duplicados

    async def scrape_product(self, page: Page, url: str) -> Optional[ScrapedProduct]:
        """
        Extrae todos los datos de un producto individual en Dentaltix.

        Estructura típica de página de producto Dentaltix:
        - Precio: .price-box .price o [data-price-type="finalPrice"] .price
        - EAN: en una tabla de especificaciones o meta tag
        - Ref fabricante: en tabla de especificaciones
        - Stock: botón "Añadir al carrito" visible o mensaje "Agotado"
        - Imagen: img.gallery-placeholder__image
        """
        try:
            # ---- Nombre del producto ----
            name_el = await page.query_selector("h1.page-title span, h1.product-name")
            if not name_el:
                logger.warning(f"Sin nombre en {url}")
                return None
            name = (await name_el.inner_text()).strip()

            # ---- Precio ----
            price = None

            # Intentar obtener precio desde el JSON-LD de la página (más fiable)
            json_ld_script = await page.query_selector('script[type="application/ld+json"]')
            if json_ld_script:
                import json
                try:
                    json_ld = json.loads(await json_ld_script.inner_text())
                    if isinstance(json_ld, list):
                        json_ld = next((item for item in json_ld if item.get("@type") == "Product"), {})
                    offers = json_ld.get("offers", {})
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    price_raw = offers.get("price")
                    if price_raw:
                        price = float(str(price_raw).replace(",", "."))
                except Exception:
                    pass

            # Si no hay JSON-LD, buscar en el DOM
            if not price:
                price_selectors = [
                    "[data-price-type='finalPrice'] .price",
                    ".price-box .price",
                    ".regular-price .price",
                    ".price",
                ]
                for selector in price_selectors:
                    price_el = await page.query_selector(selector)
                    if price_el:
                        price_text = await price_el.inner_text()
                        # Limpiar: "4,35 €" → 4.35
                        price_clean = re.sub(r"[^\d,.]", "", price_text).replace(",", ".")
                        try:
                            price = float(price_clean)
                            if price > 0:
                                break
                        except ValueError:
                            continue

            if not price or price <= 0:
                logger.warning(f"Sin precio válido en {url}")
                return None

            # ---- Precio con IVA (21%) ----
            price_with_vat = round(price * 1.21, 2)

            # ---- Stock ----
            in_stock = True
            out_of_stock_el = await page.query_selector(
                ".stock.unavailable, .out-of-stock, [data-stock='out-of-stock']"
            )
            if out_of_stock_el:
                in_stock = False

            # Verificar si el botón de añadir al carrito está disponible
            add_to_cart = await page.query_selector("button#product-addtocart-button")
            if add_to_cart:
                disabled = await add_to_cart.get_attribute("disabled")
                if disabled:
                    in_stock = False

            # ---- EAN y Referencia de Fabricante (tabla de especificaciones) ----
            ean = None
            manufacturer_ref = None

            spec_rows = await page.query_selector_all(
                "table.data.table.additional-attributes tr, "
                ".product.attribute .value, "
                ".additional-attributes-wrapper tr"
            )

            for row in spec_rows:
                label_el = await row.query_selector("th, .label")
                value_el = await row.query_selector("td, .data")
                if label_el and value_el:
                    label = (await label_el.inner_text()).strip().lower()
                    value = (await value_el.inner_text()).strip()

                    if any(k in label for k in ["ean", "código de barras", "gtin"]):
                        ean_clean = re.sub(r"\D", "", value)
                        if len(ean_clean) in [8, 13]:
                            ean = ean_clean

                    if any(k in label for k in ["referencia", "ref.", "código fabricante", "mpn"]):
                        manufacturer_ref = value

            # ---- SKU de la tienda ----
            sku = None
            sku_el = await page.query_selector('[itemprop="sku"], .product.sku .value')
            if sku_el:
                sku = (await sku_el.inner_text()).strip()

            # ---- Imagen ----
            image_url = None
            img_el = await page.query_selector("img.gallery-placeholder__image, img.photo.image")
            if img_el:
                image_url = await img_el.get_attribute("src")

            # ---- Marca ----
            brand = None
            brand_el = await page.query_selector('[itemprop="brand"] [itemprop="name"], .product.brand .value')
            if brand_el:
                brand = (await brand_el.inner_text()).strip()

            return ScrapedProduct(
                store_slug=self.store_slug,
                store_url=url,
                name=name,
                price=price,
                price_with_vat=price_with_vat,
                in_stock=in_stock,
                store_sku=sku,
                ean=ean,
                manufacturer_ref=manufacturer_ref,
                image_url=image_url,
                brand=brand,
            )

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return None


if __name__ == "__main__":
    import asyncio
    scraper = DentaltixScraper()
    asyncio.run(scraper.run())
