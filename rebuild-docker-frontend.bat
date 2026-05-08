@echo off
echo =========================================
echo   REBUILD FRONTEND DOCKER
echo   Nouveau Dashboard Unifie
echo =========================================
echo.
echo Ce script va:
echo   1. Arreter les conteneurs
echo   2. Rebuilder l'image frontend
echo   3. Relancer tous les services
echo.
echo Duree estimee: 3-5 minutes
echo.
pause

echo.
echo [1/5] Arret des conteneurs...
docker-compose down
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'arreter les conteneurs
    pause
    exit /b 1
)

echo.
echo [2/5] Suppression ancienne image frontend...
docker rmi alamine_bouba_project_v0-frontend 2>nul
echo (Ignore l'erreur si image n'existait pas)

echo.
echo [3/5] Rebuild image frontend (sans cache)...
echo (Cela peut prendre 2-3 minutes...)
echo.
docker-compose build --no-cache frontend
if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Build failed
    echo.
    echo Possibles causes:
    echo   - npm install error
    echo   - Fichiers manquants
    echo   - Probleme reseau
    echo.
    echo Voir les logs ci-dessus pour details
    pause
    exit /b 1
)

echo.
echo [4/5] Relance des services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Demarrage failed
    pause
    exit /b 1
)

echo.
echo [5/5] Attente demarrage complet (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo Verification des conteneurs...
docker-compose ps

echo.
echo =========================================
echo   DEPLOIEMENT TERMINE
echo =========================================
echo.
echo L'application est accessible sur:
echo   http://localhost
echo.
echo Pour tester le nouveau dashboard:
echo   1. Ouvrir: http://localhost/login
echo   2. Login avec compte agent agricole
echo   3. Vous serez redirige vers: /agent/dashboard
echo   4. Cliquer "Nouveau Perimetre"
echo   5. Dessiner sur la carte
echo.
echo Fonctionnalites du nouveau dashboard:
echo   * Tout sur une seule page
echo   * Gestion perimetres integree (dialog)
echo   * Stats compactes (4 cards)
echo   * Design moderne (gradients)
echo.
echo Si le dashboard ne s'affiche pas:
echo   1. Vider cache navigateur (Ctrl+Shift+R)
echo   2. Verifier logs: docker-compose logs frontend
echo   3. Verifier URL: /agent/dashboard (pas /agent/dashboard-old)
echo.
echo Pour voir les logs en temps reel:
echo   docker-compose logs -f frontend
echo.
echo Pour arreter l'application:
echo   docker-compose down
echo.
echo =========================================
echo.
pause
