Write-Host "Checking Docker build progress..." -ForegroundColor Cyan

# Check running containers
Write-Host "`nContainers:" -ForegroundColor Yellow
docker ps -a --filter "name=frontend" --format "table {{.Names}}\t{{.Status}}"

# Check images
Write-Host "`nImages:" -ForegroundColor Yellow
docker images | Select-String "frontend"

# Check build cache
Write-Host "`nDocker disk usage:" -ForegroundColor Yellow
docker system df

# Estimate time
$startTime = Get-Date "2026-01-31 01:03:49"
$currentTime = Get-Date
$elapsed = $currentTime - $startTime
Write-Host "`nElapsed time: $($elapsed.TotalMinutes.ToString('0.0')) minutes" -ForegroundColor Green
Write-Host "Typical npm install in Docker on Windows: 30-60 minutes for first build" -ForegroundColor Gray
