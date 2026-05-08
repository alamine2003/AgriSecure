@echo off
echo ===============================================
echo NETTOYAGE DES ANCIENS SCRIPTS .BAT
echo ===============================================
echo.
echo Cette action va SUPPRIMER les anciens fichiers .bat
echo car tout est maintenant centralise dans le Makefile.
echo.
echo Fichiers a supprimer:
echo   - acces-direct-services.bat
echo   - debug-login.bat
echo   - fix-502-quick.bat
echo   - fix-login-redirection.bat
echo   - fix-nginx-force.bat
echo   - restart-frontend.bat
echo   - start-dev.bat
echo   - start-prod.bat
echo   - test-login-complet.bat
echo.
echo Ces fichiers sont remplaces par:
echo   - make start-dev
echo   - make start-prod
echo   - make fix-login
echo   - make fix-nginx
echo   - etc.
echo.

set /p confirm="Confirmer la suppression ? (O/N): "
if /i NOT "%confirm%"=="O" (
    echo Operation annulee.
    pause
    exit /b 0
)

echo.
echo Suppression en cours...

del /Q acces-direct-services.bat 2>nul
del /Q debug-login.bat 2>nul
del /Q fix-502-quick.bat 2>nul
del /Q fix-login-redirection.bat 2>nul
del /Q fix-nginx-force.bat 2>nul
del /Q restart-frontend.bat 2>nul
del /Q start-dev.bat 2>nul
del /Q start-prod.bat 2>nul
del /Q test-login-complet.bat 2>nul

echo.
echo ===============================================
echo NETTOYAGE TERMINE
echo ===============================================
echo.
echo ✓ Anciens scripts supprimes
echo.
echo Utilise maintenant:
echo   make help          # Voir toutes les commandes
echo   make start-dev     # Demarrer mode dev
echo   make fix-login     # Corriger login
echo.
echo Documentation:
echo   COMMANDES.md       # Guide des commandes Makefile
echo.

pause
