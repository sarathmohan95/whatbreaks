# Build script for static export
# Temporarily removes API routes that don't work with static export

$ErrorActionPreference = "Stop"

Write-Host "Building Next.js for static export..." -ForegroundColor Cyan

# The API routes are not needed for static export since we call Lambda directly
# Next.js will skip them automatically during static export

# Just run the build
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Output in ./out directory" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
