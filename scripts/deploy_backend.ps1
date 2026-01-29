#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Prepares the Django backend for deployment: installs Python dependencies,
    seeds the JSON repository, runs migrations, and collects static assets.
>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
$originalLocation = Get-Location

try {
    Set-Location $projectRoot

    Write-Host "[setup] Setting up Django backend in $projectRoot"

    $pythonCandidates = @("python", "python3")
    $pythonCmd = $pythonCandidates |
        Where-Object { Get-Command $_ -ErrorAction SilentlyContinue } |
        Select-Object -First 1

    if (-not $pythonCmd) {
        throw "Python was not found on PATH. Install Python 3.10+ and try again."
    }

    if (-not (Test-Path ".venv")) {
        Write-Host "[setup] Creating virtual environment"
        & $pythonCmd -m venv .venv
    }

    if ($IsWindows) {
        $pythonExeRelative = ".venv\Scripts\python.exe"
    } else {
        $pythonExeRelative = ".venv/bin/python"
    }

    if (-not (Test-Path $pythonExeRelative)) {
        throw "Unable to locate the Python interpreter inside .venv (`$pythonExeRelative`)."
    }

    $pythonPath = (Resolve-Path $pythonExeRelative).Path

    $pipArgs = @()
    function Invoke-Pip {
        param([string[]]$Args)
        & $pythonPath -m pip @Args
    }

    Write-Host "[setup] Upgrading pip, setuptools, and wheel"
    Invoke-Pip -Args @("install", "--upgrade", "pip", "setuptools", "wheel")

    Write-Host "[setup] Installing project dependencies"
    Invoke-Pip -Args @("install", "-e", ".")

    $requirementsPath = Join-Path $projectRoot "requirements-dev.txt"
    if (Test-Path $requirementsPath) {
        Write-Host "[setup] Installing development helpers from requirements-dev.txt"
        Invoke-Pip -Args @("install", "-r", $requirementsPath)
    }

    $dataDir = Join-Path $projectRoot "data"
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir | Out-Null
    }

    $loadsJson = Join-Path $dataDir "loads.json"
    if (-not (Test-Path $loadsJson)) {
        Write-Host "[setup] Creating initial data/loads.json"
        "[]" | Out-File -Encoding utf8 $loadsJson
    }

    Write-Host "[setup] Running Django migrations"
    & $pythonPath manage.py migrate --noinput

    Write-Host "[setup] Collecting static assets (expect frontend build to exist)"
    & $pythonPath manage.py collectstatic --noinput

    Write-Host "[setup] Backend prep complete. Activate the venv (`.venv\\Scripts\\Activate.ps1` on Windows or `.venv/bin/activate` elsewhere) to run the server."
} finally {
    Set-Location $originalLocation
}
