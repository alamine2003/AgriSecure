# Script de vérification du système
# Vérifie que tous les prérequis sont installés

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification du Système" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Vérifier Docker
Write-Host "Vérification Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker installé : $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Docker n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez Docker Desktop : https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Vérifier Docker Compose
Write-Host "Vérification Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "[OK] Docker Compose installé : $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Docker Compose n'est pas installé" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Vérifier si Docker est démarré
Write-Host "Vérification Docker daemon..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "[OK] Docker daemon est démarré" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Docker daemon n'est pas démarré" -ForegroundColor Red
    Write-Host "Démarrez Docker Desktop" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Vérifier les fichiers de configuration
Write-Host "Vérification fichiers de configuration..." -ForegroundColor Yellow
if (Test-Path ".env.docker") {
    Write-Host "[OK] Fichier .env.docker trouvé" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Write-Host "[ATTENTION] Fichier .env.docker manquant, création..." -ForegroundColor Yellow
        Copy-Item .env.example .env.docker
        Write-Host "[OK] Fichier .env.docker créé" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Fichiers .env manquants" -ForegroundColor Red
        $allGood = $false
    }
}

if (Test-Path "docker-compose.yml") {
    Write-Host "[OK] Fichier docker-compose.yml trouvé" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Fichier docker-compose.yml manquant" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "Makefile") {
    Write-Host "[OK] Makefile trouvé" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Makefile manquant" -ForegroundColor Yellow
}

Write-Host ""

# Vérifier les ports disponibles
Write-Host "Vérification des ports..." -ForegroundColor Yellow
$ports = @(80, 443, 5432, 6379, 8000, 9000, 9001, 5050, 5555)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "[ATTENTION] Ports déjà utilisés : $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "Vous devrez peut-être arrêter les services utilisant ces ports" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Tous les ports nécessaires sont disponibles" -ForegroundColor Green
}

Write-Host ""

# Vérifier l'espace disque
Write-Host "Vérification espace disque..." -ForegroundColor Yellow
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeGB -lt 10) {
    Write-Host "[ATTENTION] Espace disque faible : $freeGB GB disponibles" -ForegroundColor Yellow
    Write-Host "Recommandé : 10 GB minimum" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Espace disque suffisant : $freeGB GB disponibles" -ForegroundColor Green
}

Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "[OK] Tous les prérequis sont satisfaits !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "1. Double-cliquez sur start-app.bat" -ForegroundColor White
    Write-Host "   OU exécutez : docker-compose up -d" -ForegroundColor White
    Write-Host "2. Attendez 2-3 minutes que tous les services démarrent" -ForegroundColor White
    Write-Host "3. Accédez à http://localhost" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour créer un superutilisateur :" -ForegroundColor Cyan
    Write-Host "docker-compose exec backend python manage.py createsuperuser" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[ERREUR] Des problèmes ont été détectés" -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs ci-dessus avant de continuer" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour quitter..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
