"""
MedicalChollo — Clase base para todos los scrapers
Soporta Base de Datos Local SQLite (medicalchollo.db) y PostgreSQL
"""

import os
import sys
import random
import time
import asyncio
import sqlite3
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from dataclasses import dataclass
from loguru import logger
from dotenv import load_dotenv
from playwright.async_api import async_playwright, Browser, Page

load_dotenv()

# Ruta a la base de datos local SQLite
SQLITE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "medicalchollo.db"))

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
]

@dataclass
class ScrapedProduct:
    store_slug: str
    store_name: str
    store_url: str
    name: str
    price: float
    price_with_vat: Optional[float] = None
    in_stock: bool = True
    stock_qty: Optional[int] = None
    store_sku: Optional[str] = None
    ean: Optional[str] = None
    manufacturer_ref: Optional[str] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None

class BaseScraper(ABC):
    store_name: str = ""
    store_slug: str = ""
    base_url: str = ""

    def __init__(self):
        self.db_conn = None
        self.browser: Optional[Browser] = None
        self.products_scraped = 0
        self.products_updated = 0
        self.errors = 0
        self.started_at = datetime.utcnow()

        os.makedirs("logs", exist_ok=True)
        logger.add(
            f"logs/{self.store_slug}_{datetime.utcnow().strftime('%Y%m%d')}.log",
            rotation="1 day",
            retention="7 days",
            level="INFO",
        )

    @abstractmethod
    async def get_category_urls(self) -> list[str]: ...

    @abstractmethod
    async def scrape_product_list(self, page: Page, category_url: str) -> list[str]: ...

    @abstractmethod
    async def scrape_product(self, page: Page, url: str) -> Optional[ScrapedProduct]: ...

    def _get_db(self) -> sqlite3.Connection:
        """Obtiene conexión a la base de datos local SQLite."""
        if not self.db_conn:
            self.db_conn = sqlite3.connect(SQLITE_PATH)
            self.db_conn.row_factory = sqlite3.Row
        return self.db_conn

    def _find_product(self, scraped: ScrapedProduct) -> Optional[str]:
        """Busca un producto por EAN, referencia o nombre."""
        conn = self._get_db()
        cur = conn.cursor()

        if scraped.ean:
            cur.execute("SELECT id FROM products WHERE ean = ? AND is_active = 1", (scraped.ean,))
            row = cur.fetchone()
            if row: return row["id"]

        if scraped.manufacturer_ref:
            cur.execute("SELECT id FROM products WHERE manufacturer_ref = ? AND is_active = 1", (scraped.manufacturer_ref,))
            row = cur.fetchone()
            if row: return row["id"]

        # Búsqueda por similitud de nombre
        clean_name = scraped.name.split("-")[0].strip()
        cur.execute("SELECT id FROM products WHERE name LIKE ? AND is_active = 1", (f"%{clean_name[:25]}%",))
        row = cur.fetchone()
        if row: return row["id"]

        return None

    def _upsert_price(self, product_id: str, scraped: ScrapedProduct) -> bool:
        """Guarda o actualiza el precio en SQLite y recalcula el mínimo."""
        conn = self._get_db()
        try:
            cur = conn.cursor()
            price_id = f"{product_id}-{self.store_slug}"

            cur.execute("""
                INSERT INTO product_prices (id, product_id, store_slug, store_name, price, price_with_vat, in_stock, store_url, last_scraped)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    price = excluded.price,
                    price_with_vat = excluded.price_with_vat,
                    in_stock = excluded.in_stock,
                    store_url = excluded.store_url,
                    last_scraped = datetime('now')
            """, (
                price_id,
                product_id,
                self.store_slug,
                self.store_name,
                scraped.price,
                scraped.price_with_vat or round(scraped.price * 1.21, 2),
                1 if scraped.in_stock else 0,
                scraped.store_url
            ))

            # Guardar en histórico
            today = datetime.utcnow().strftime("%Y-%m-%d")
            hist_id = f"{price_id}-{today}"
            cur.execute("""
                INSERT OR REPLACE INTO price_history (id, product_id, store_name, price, recorded_at)
                VALUES (?, ?, ?, ?, ?)
            """, (hist_id, product_id, self.store_name, scraped.price, today))

            # Recalcular precio mínimo del producto
            cur.execute("""
                UPDATE products
                SET min_price = (
                    SELECT MIN(price) FROM product_prices WHERE product_id = ? AND in_stock = 1
                ),
                min_price_store_name = (
                    SELECT store_name FROM product_prices WHERE product_id = ? AND in_stock = 1 ORDER BY price ASC LIMIT 1
                ),
                updated_at = datetime('now')
                WHERE id = ?
            """, (product_id, product_id, product_id))

            conn.commit()
            self.products_updated += 1
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Error guardando precio: {e}")
            return False

    async def run(self):
        """Ejecuta el ciclo de scraping."""
        logger.info(f"🚀 Iniciando scraper: {self.store_name}")
        self.started_at = datetime.utcnow()

        async with async_playwright() as p:
            self.browser = await p.chromium.launch(headless=True)
            try:
                category_urls = await self.get_category_urls()
                for cat_url in category_urls:
                    page = await self.browser.new_page(locale="es-ES")
                    try:
                        await page.goto(cat_url, wait_until="domcontentloaded", timeout=45000)
                        prod_urls = await self.scrape_product_list(page, cat_url)
                    finally:
                        await page.close()

                    for p_url in prod_urls:
                        p_page = await self.browser.new_page(locale="es-ES")
                        try:
                            await p_page.goto(p_url, wait_until="domcontentloaded", timeout=45000)
                            scraped = await self.scrape_product(p_page, p_url)
                            if scraped:
                                self.products_scraped += 1
                                pid = self._find_product(scraped)
                                if pid:
                                    self._upsert_price(pid, scraped)
                                    logger.info(f"✅ Precio actualizado: {scraped.name[:40]} -> {scraped.price}€")
                        except Exception as e:
                            self.errors += 1
                            logger.error(f"Error en {p_url}: {e}")
                        finally:
                            await p_page.close()

                logger.info(f"🎉 Scraping completado: {self.products_scraped} procesados, {self.products_updated} guardados.")
            finally:
                await self.browser.close()
                if self.db_conn:
                    self.db_conn.close()
