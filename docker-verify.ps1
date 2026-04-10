# ============================================
# TIVA Platform Docker Build Verification
# Pre-Launch Validation
# ============================================

Write-Host "Docker Build Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\Administrator\master-dashboard"

# Check Docker daemon
Write-Host "[1/5] Checking Docker daemon..." -ForegroundColor Yellow

$dockerCheck = docker ps 2>$null
if ($?) {
    Write-Host "checkmark Docker daemon is running" -ForegroundColor Green
}
else {
    Write-Host "X Docker daemon is not running or not accessible" -ForegroundColor Red
    exit 1
}

# Validate docker-compose.yml syntax
Write-Host "[2/5] Validating docker-compose.yml..." -ForegroundColor Yellow

$composeCheck = docker-compose config 2>$null
if ($?) {
    Write-Host "checkmark docker-compose.yml syntax valid" -ForegroundColor Green
}
else {
    Write-Host "X docker-compose.yml has errors" -ForegroundColor Red
    docker-compose config
    exit 1
}

# Check Dockerfiles exist
Write-Host "[3/5] Checking Dockerfiles..." -ForegroundColor Yellow

$apiDockerfile = Test-Path "api/Dockerfile"
$dashboardDockerfile = Test-Path "dashboard/Dockerfile"

if ($apiDockerfile -and $dashboardDockerfile) {
    Write-Host "checkmark Both Dockerfiles found" -ForegroundColor Green
}
else {
    if (-not $apiDockerfile) { Write-Host "X api/Dockerfile missing" -ForegroundColor Red }
    if (-not $dashboardDockerfile) { Write-Host "X dashboard/Dockerfile missing" -ForegroundColor Red }
    exit 1
}

# Build images
Write-Host "[4/5] Building Docker images..." -ForegroundColor Yellow

docker-compose build
if ($?) {
    Write-Host "checkmark Images built successfully" -ForegroundColor Green
}
else {
    Write-Host "X Image build failed" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "[5/5] Build verification complete" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All checks passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services configured:" -ForegroundColor Cyan
Write-Host "  * PostgreSQL   (port 5433)" -ForegroundColor White
Write-Host "  * API          (port 4000)" -ForegroundColor White
Write-Host "  * Dashboard    (port 3100)" -ForegroundColor White
Write-Host "  * Nginx proxy  (port 8090)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. .\launch-github.ps1          (commit and push to GitHub)" -ForegroundColor White
Write-Host "  2. docker-compose up -d         (start services locally)" -ForegroundColor White
Write-Host "  3. http://localhost:8090        (access dashboard via Nginx)" -ForegroundColor White
Write-Host ""
