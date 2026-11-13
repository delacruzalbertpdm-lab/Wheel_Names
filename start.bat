@echo off
echo ===================================================
echo   Starting PulseDraw - Random Player Selection System
echo ===================================================

echo [1/2] Starting Django Backend API on http://127.0.0.1:8000 ...
start "PulseDraw Backend (Django)" cmd /k "cd /d "%~dp0backend" && "C:\Users\USER1\AppData\Local\Python\bin\python.exe" manage.py migrate && "C:\Users\USER1\AppData\Local\Python\bin\python.exe" manage.py seed_participants && "C:\Users\USER1\AppData\Local\Python\bin\python.exe" manage.py runserver 0.0.0.0:8000"

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "PulseDraw Frontend (React)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Open http://localhost:5173 in your browser.
pause
