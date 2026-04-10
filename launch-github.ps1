# ============================================
# TIVA Platform → Docker → GitHub Push Script
# Launch-Ready Preparation
# ============================================

param(
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Docker → GitHub Launch Sync..." -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location "C:\Users\Administrator\master-dashboard"

# ============================================
# 1. Create .dockerignore (protects heavy folders)
# ============================================
Write-Host "[1/6] Creating .dockerignore..." -ForegroundColor Yellow

$dockerignoreContent = @"
node_modules
.git
.env
.env.local
*.log
logs
tmp
cache
.vscode
.claude
.next
dist
build
coverage
.DS_Store
*.swp
*.swo
~*
"@

$dockerignoreContent | Out-File -Encoding utf8 -NoNewline .dockerignore
Write-Host "✔ .dockerignore created" -ForegroundColor Green

# ============================================
# 2. Create/Update .gitignore (protects secrets)
# ============================================
Write-Host "[2/6] Creating .gitignore protection..." -ForegroundColor Yellow

$gitignoreContent = @"
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables (NEVER commit secrets)
.env
.env.local
.env.*.local

# Build outputs
.next/
dist/
build/
coverage/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Temporary files
tmp/
cache/
*.swp
*.swo
~*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.claude/

# Runtime
.pid
"@

$gitignoreContent | Out-File -Encoding utf8 -NoNewline .gitignore
Write-Host "✔ .gitignore created" -ForegroundColor Green

# ============================================
# 3. Verify docker-compose.yml exists
# ============================================
Write-Host "[3/6] Verifying docker-compose.yml..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yml") {
    Write-Host "✔ docker-compose.yml found" -ForegroundColor Green
}
else {
    Write-Host "✗ docker-compose.yml missing — ABORT" -ForegroundColor Red
    exit 1
}

# ============================================
# 4. Git initialization & setup
# ============================================
Write-Host "[4/6] Initializing Git repository..." -ForegroundColor Yellow

# Check if git exists
$gitCheck = git --version 2>$null
if (-not $gitCheck) {
    Write-Host "✗ Git not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Initialize if not already done
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✔ Git repository initialized" -ForegroundColor Green
}
else {
    Write-Host "✔ Git repository already exists" -ForegroundColor Green
}

# Ensure main branch
git branch -M main 2>$null

# Set GitHub remote
git remote remove origin 2>$null
git remote add origin https://github.com/foundertiva-crypto/master-dashboard.git
Write-Host "✔ GitHub remote configured" -ForegroundColor Green

# ============================================
# 5. Stage & commit files
# ============================================
Write-Host "[5/6] Staging project files..." -ForegroundColor Yellow

git add .
Write-Host "✔ Files staged" -ForegroundColor Green

Write-Host "[5/6] Creating commit..." -ForegroundColor Yellow

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    git commit -m "Full Docker Platform Upload - Launch Ready" -m "" -m "Assisted-By: docker-agent"
    Write-Host "✔ Commit created" -ForegroundColor Green
}
else {
    Write-Host "⚠ No changes to commit" -ForegroundColor Yellow
}

# ============================================
# 6. Push to GitHub
# ============================================
Write-Host "[6/6] Pushing to GitHub (main)..." -ForegroundColor Yellow

if ($Force) {
    git push -u origin main --force
    Write-Host "✔ Force push completed" -ForegroundColor Green
}
else {
    git push -u origin main
    Write-Host "✔ Push completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "GitHub Push Completed Successfully" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: https://github.com/foundertiva-crypto/master-dashboard" -ForegroundColor Cyan
Write-Host "Branch: main" -ForegroundColor Cyan
Write-Host ""
