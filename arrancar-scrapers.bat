@echo off
echo.
echo  ================================================
echo   MedicalChollo - Arrancar Scrapers (cada 12h)
echo  ================================================
echo.
echo  Los scrapers se ejecutaran automaticamente cada 12 horas.
echo  Deja esta ventana abierta.
echo.
cd scrapers
call venv\Scripts\activate.bat
python scheduler.py
pause
