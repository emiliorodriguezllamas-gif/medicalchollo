"""
MedicalChollo — Scheduler de Scraping
Ejecuta todos los scrapers automáticamente cada 12 horas.
"""

import asyncio
import sys
import os
from datetime import datetime
from loguru import logger
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Añadir directorio de stores al path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "stores"))

from stores.dentaltix_scraper import DentaltixScraper
from stores.proclinic_scraper import ProclinicScraper


# ---- Configuración de scrapers activos ----
SCRAPERS = [
    DentaltixScraper,
    ProclinicScraper,
    # Añadir aquí más scrapers a medida que se desarrollen:
    # DVDDentalScraper,
    # HerbitasScraper,
]

# ---- Intervalo de actualización ----
INTERVAL_HOURS = 12


async def run_all_scrapers():
    """Ejecuta todos los scrapers secuencialmente."""
    start = datetime.utcnow()
    logger.info(f"🕐 Iniciando ciclo de scraping — {start.strftime('%Y-%m-%d %H:%M UTC')}")

    for ScraperClass in SCRAPERS:
        scraper = ScraperClass()
        try:
            await scraper.run()
        except Exception as e:
            logger.error(f"❌ Error en {ScraperClass.store_name}: {e}")
        finally:
            # Espera entre scrapers para no sobrecargar la red
            await asyncio.sleep(60)

    duration = (datetime.utcnow() - start).total_seconds() / 60
    logger.info(f"✅ Ciclo completado en {duration:.1f} minutos")


async def main():
    """Punto de entrada del scheduler."""
    logger.info("🚀 MedicalChollo Scraper Scheduler iniciado")
    logger.info(f"📋 Scrapers configurados: {[s.store_name for s in SCRAPERS]}")
    logger.info(f"⏱️  Intervalo de actualización: cada {INTERVAL_HOURS} horas")

    # Crear directorio de logs
    os.makedirs("logs", exist_ok=True)

    # Ejecutar inmediatamente al arrancar
    logger.info("▶️  Ejecutando scraping inicial...")
    await run_all_scrapers()

    # Programar ejecuciones periódicas
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_all_scrapers,
        trigger=IntervalTrigger(hours=INTERVAL_HOURS),
        id="scraping_cycle",
        name="Ciclo de scraping MedicalChollo",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"⏰ Próxima ejecución programada en {INTERVAL_HOURS} horas")

    # Mantener el scheduler corriendo indefinidamente
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Scheduler detenido")
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
