param(
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$env:DOCKER_BUILDKIT = "0"

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & docker compose @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Review MySQL and JWT settings if needed."
}

Invoke-DockerCompose -Arguments @("build") -FailureMessage "docker compose build failed."

if (-not $BuildOnly) {
    Invoke-DockerCompose -Arguments @("up", "-d") -FailureMessage "docker compose up failed."
    Write-Host "AI Platform started: http://localhost:8081"
    Write-Host "Backend API: http://localhost:8080/swagger-ui.html"
}
