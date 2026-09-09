"""
MedicalChollo — Scraper de Proclinic.es
Proclinic es uno de los distribuidores integrales más grandes de España
con más de 55.000 productos para clínicas.
"""

import re
import json
import asyncio
from typing import Optional
from loguru import logger
from playwright.async_api import Page
from base_scraper import BaseScraper, ScrapedProduct


class ProclinicScraper(BaseScraper):

    store_name = "Proclinic"
    store_slug = "proclinic"
    base_url = "https://www.proclinic.es"

    CATEGORIES = [
        "/c/anestesia-dental",
        "/c/guantes",
        "/c/composites",
        "/c/fresas",
        "/c/endodoncia",
        "/c/material-fungible",
        "/c/higiene-oral",
        "/c/instrumental-dental",
        "/c/material-podologia",
    ]

    async def get_category_urls(self) -> list[str]:
        return [f"{self.base_url}{cat}" for cat in self.CATEGORIES]

    async def scrape_product_list(self, page: Page, category_url: str) -> list[str]:
        product_urls = []
        current_url = category_url
        page_num = 1
        max_pages = 20  # Límite de seguridad

        while page_num <= max_pages:
            try:
                # Proclinic usa parámetro ?page=N en la paginación
                page_url = f"{current_url}?page={page_num}" if page_num > 1 else current_url
                if page_num > 1:
                    await page.goto(page_url, wait_until="domcontentloaded")
                    await asyncio.sleep(1.5)

                links = await page.query_selector_all(
                    "a.product-item-link, .product-name a, h2.product-name a, "
                    ".product-card a[href*='/p/'], article.product a"
                )

                if not links:
                    break

                new_found = 0
                for link in links:
                    href = await link.get_attribute("href")
                    if href and href not in product_urls:
                        if not href.startswith("http"):
                            href = self.base_url + href
                        product_urls.append(href)
                        new_found += 1

                if new_found == 0:
                    break  # No hay más productos

                page_num += 1

            except Exception as e:
                logger.warning(f"Error en página {page_num} de {category_url}: {e}")
                break

        return list(set(product_urls))

    async def scrape_product(self, page: Page, url: str) -> Optional[ScrapedProduct]:
        """Extrae datos de un producto de Proclinic."""
        try:
            # ---- Nombre ----
            name_el = await page.query_selector("h1.product-name, h1.ProductPage-name, h1")
            if not name_el:
                return None
            name = (await name_el.inner_text()).strip()
            if not name:
                return None

            # ---- Precio (JSON-LD primero) ----
            price = None
            price_with_vat = None

            # Proclinic suele mostrar precios con IVA, luego calculamos sin IVA
            for script in await page.query_selector_all('script[type="application/ld+json"]'):
                try:
                    data = json.loads(await script.inner_text())
                    if isinstance(data, list):
                        for item in data:
                            if item.get("@type") == "Product":
                                data = item
                                break
                    if data.get("@type") == "Product":
                        offers = data.get("offers", {})
                        if isinstance(offers, list) and offers:
                            offers = offers[0]
                        price_raw = offers.get("price")
                        if price_raw:
                            price_with_vat = float(str(price_raw).replace(",", "."))
                            # Calcular precio sin IVA (21%)
                            price = round(price_with_vat / 1.21, 2)
                            break
                except Exception:
                    continue

            # Fallback: buscar en DOM
            if not price:
                price_selectors = [
                    ".product-price .price, .ProductPrice, .price-value",
                    "[data-price-type='finalPrice'] .price",
                    ".price",
                ]
                for selector in price_selectors:
                    el = await page.query_selector(selector)
                    if el:
                        text = await el.inner_text()
                        clean = re.sub(r"[^\d,.]", "", text).replace(",", ".")
                        try:
                            val = float(clean)
                            if val > 0:
                                price_with_vat = val
                                price = round(val / 1.21, 2)
                                break
                        except ValueError:
                            continue

            if not price or price <= 0:
                return None

            # ---- Stock ----
            in_stock = True
            out_el = await page.query_selector(".out-of-stock, .sold-out, [data-availability='OutOfStock']")
            if out_el:
                in_stock = False

            # ---- EAN y Ref fabricante ----
            ean = None
            manufacturer_ref = None

            # Buscar en tabla de especificaciones
            spec_tables = await page.query_selector_all(
                ".product-specifications tr, .ProductSpecs tr, table tr"
            )
            for row in spec_tables:
                cells = await row.query_selector_all("th, td")
                if len(cells) >= 2:
                    label = (await cells[0].inner_text()).strip().lower()
                    value = (await cells[1].inner_text()).strip()

                    if any(k in label for k in ["ean", "código barras", "barcode"]):
                        ean_clean = re.sub(r"\D", "", value)
                        if len(ean_clean) in [8, 13]:
                            ean = ean_clean

                    if any(k in label for k in ["referencia", "ref", "código fabricante", "código proveedor"]):
                        manufacturer_ref = value

            # ---- SKU ----
            sku = None
            sku_el = await page.query_selector('[itemprop="sku"], .product-sku, .sku-value')
            if sku_el:
                sku = (await sku_el.inner_text()).strip()

            # ---- Imagen ----
            image_url = None
            img_el = await page.query_selector("img.product-main-image, img.primary-image, .gallery-image img")
            if img_el:
                image_url = await img_el.get_attribute("src")

            # ---- Marca ----
            brand = None
            brand_el = await page.query_selector('[itemprop="brand"], .product-brand, .brand-name')
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
    scraper = ProclinicScraper()
    asyncio.run(scraper.run())
