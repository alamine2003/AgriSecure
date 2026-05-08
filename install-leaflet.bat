@echo off
echo Installation de Leaflet et React-Leaflet...
echo.

cd frontend

echo Installation des packages...
call npm install leaflet react-leaflet

echo.
echo Installation terminee!
echo.
echo Vous pouvez maintenant redemarrer le serveur:
echo   npm run dev
echo.
pause
