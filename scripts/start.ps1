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

$AppPort = "8081"
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^APP_PORT=(.+)$") {
        $AppPort = $Matches[1].Trim()
    }
}

Invoke-DockerCompose -Arguments @("build") -FailureMessage "docker compose build failed."

if (-not $BuildOnly) {
    Invoke-DockerCompose -Arguments @("up", "-d", "--remove-orphans") -FailureMessage "docker compose up failed."
    Write-Host "AI Platform started: http://localhost:$AppPort"
    Write-Host "Swagger: http://localhost:$AppPort/swagger-ui.html"
}
