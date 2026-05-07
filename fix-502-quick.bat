@echo off
echo ========================================
echo CORRECTION RAPIDE ERREUR 502
echo ========================================
echo.

echo [INFO] Le probleme: Frontend tourne sur port 3000, nginx cherche port 80
echo [INFO] Solution: Reconstruire nginx avec la config dev (port 3000)
echo.

echo [ETAPE 1/4] Arret nginx...
docker-compose stop nginx

echo.
echo [ETAPE 2/4] Reconstruction nginx avec nouvelle config...
docker-compose build nginx

echo.
echo [ETAPE 3/4] Redemarrage nginx...
docker-compose up -d nginx

echo.
echo [ETAPE 4/4] Verification...
timeout /t 3 /nobreak >nul
docker-compose ps nginx

echo.
echo ========================================
echo CORRECTION TERMINEE !
echo ========================================
echo.
echo Testez maintenant :
echo   http://localhost          (Page d'accueil)
echo   http://localhost/login    (Connexion)
echo   http://localhost/admin/   (Django Admin)
echo.
echo Si ca marche : OK !
echo Si erreur 502 persiste, verifiez les logs :
echo   docker-compose logs nginx
echo   docker-compose logs frontend
echo.
pause
