@echo off
echo Verification logs installation...
docker-compose logs backend --tail=100 | findstr /C:"complete_installation" /C:"ERROR" /C:"500"
pause
