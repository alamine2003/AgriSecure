@echo off
echo ========================================
echo Correction Erreur 502 et Redemarrage
echo ========================================
echo.

echo [INFO] Arret des services...
docker-compose down

echo.
echo [INFO] Reconstruction des images (backend et frontend)...
docker-compose build --no-cache backend frontend nginx

echo.
echo [INFO] Demarrage des services...
docker-compose up -d

echo.
echo [INFO] Attente que les services demarrent (30 secondes)...
timeout /t 30 /nobreak

echo.
echo [INFO] Verification de l'etat des services...
docker-compose ps

echo.
echo [INFO] Affichage des logs (Ctrl+C pour arreter)...
echo.
echo ========================================
echo Services demarres !
echo ========================================
echo.
echo Acces:
echo - Application : http://localhost
echo - API Docs     : http://localhost/api/docs/
echo - Admin        : http://localhost/admin/
echo.
echo Si erreur 502 persiste, verifiez les logs:
echo   docker-compose logs backend
echo   docker-compose logs nginx
echo.
pause
echo.
docker-compose logs -f --tail=100
