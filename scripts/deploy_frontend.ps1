#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Builds the Vite frontend so Django can serve it from the dist folder.
    Installs npm dependencies and performs a production build.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
$frontendRoot = Join-Path $projectRoot "Warehouseloadingboardui-main"
$originalLocation = Get-Location

# Compatibility for Windows PowerShell 5.1 (which doesn't have $IsWindows)
if (-not (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue)) {
    $IsWindows = $env:OS -match "Windows_NT"
}

try {
    Set-Location $frontendRoot

    Write-Host "[setup] Preparing frontend in $frontendRoot"

    $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
    $npmCommand = Get-Command "npm" -ErrorAction SilentlyContinue

    if (-not $nodeCommand -or -not $npmCommand) {
        throw "Node.js and npm must be available on PATH (node >=18 recommended)."
    }

    if (Test-Path "package-lock.json") {
        Write-Host "[setup] Running npm ci (lockfile detected)"
        & $npmCommand.Path "ci"
    }
    else {
        Write-Host "[setup] Running npm install"
        & $npmCommand.Path "install"
    }

    Write-Host "[setup] Building production assets"
    & $npmCommand.Path "run" "build"

    Write-Host "[setup] Frontend build complete. Confirm dist/ contains index.html and assets for Django."
}
finally {
    Set-Location $originalLocation
}
