@echo off
echo.
echo  ================================================
echo   MedicalChollo - Prueba de Scraper en Vivo
echo  ================================================
echo.
echo  Extrayendo productos reales de Dentaltix...
echo.
cd scrapers
call venv\Scripts\activate.bat
python test_scraper_live.py
echo.
pause
