param(
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$env:DOCKER_BUILDKIT = "0"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Review MySQL and JWT settings if needed."
}

docker compose build

if (-not $BuildOnly) {
    docker compose up -d
    Write-Host "AI Platform started: http://localhost:8081"
    Write-Host "Backend API: http://localhost:8080/swagger-ui.html"
}
