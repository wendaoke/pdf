param(
  [Parameter(Mandatory = $false)]
  [string]$Mode = "build",  # build | package | deploy

  [Parameter(Mandatory = $false)]
  [string]$DistDir = "dist/pdf-merge-deploy",

  [Parameter(Mandatory = $false)]
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$DistDirAbs = if ([System.IO.Path]::IsPathRooted($DistDir)) { $DistDir } else { Join-Path $repoRoot $DistDir }
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = $OutputEncoding

function Assert-CommandExists {
  param([string]$cmd)
  $p = Get-Command $cmd -ErrorAction SilentlyContinue
  if (-not $p) {
    throw "Command not found: $cmd. Please confirm it is installed and in PATH."
  }
}

function Copy-DirIfExists {
  param([string]$src, [string]$dst)
  if (Test-Path $src) {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Copy-Item -Path (Join-Path $src "*") -Destination $dst -Recurse -Force
  }
}

Assert-CommandExists "node"
Assert-CommandExists "npm"
Assert-CommandExists "mvn"

$backendDir = Join-Path $repoRoot "backend/pdf-merge"
$frontendDir = Join-Path $repoRoot "frontend/pdf-merge-web"

if ($SkipTests) {
  $mvnSkip = "-DskipTests"
} else {
  $mvnSkip = ""
}

Write-Host "===> Mode: $Mode"
Write-Host "===> DistDir: $DistDirAbs"

if ($Mode -eq "deploy") {
  Write-Host "Note: deploy mode only starts processes; it does not start MySQL/Redis automatically."
}

if ($Mode -eq "build" -or $Mode -eq "package" -or $Mode -eq "deploy") {
  Write-Host "===> [1/3] Build backend (Spring Boot)"
  if (-not (Test-Path $backendDir)) { throw "Backend directory not found: $backendDir" }

  Push-Location $backendDir
  try {
    mvn -q clean package $mvnSkip
  } finally {
    Pop-Location
  }

  Write-Host "===> [2/3] Build frontend (Next.js)"
  if (-not (Test-Path $frontendDir)) { throw "Frontend directory not found: $frontendDir" }

  Push-Location $frontendDir
  try {
    npm install
    npm run build
  } finally {
    Pop-Location
  }
}

if ($Mode -eq "package" -or $Mode -eq "deploy") {
  Write-Host "===> [3/3] Packaging deploy artifacts to: $DistDirAbs"
  if (Test-Path $DistDirAbs) {
    Remove-Item -Recurse -Force $DistDirAbs
  }
  New-Item -ItemType Directory -Force -Path $DistDirAbs | Out-Null

  # backend jars
  $backendDist = Join-Path $DistDirAbs "backend"
  New-Item -ItemType Directory -Force -Path $backendDist | Out-Null

  $apiJar = Get-ChildItem -Path (Join-Path $backendDir "pdf-merge-api\target") -Filter "*.jar" -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $workerJar = Get-ChildItem -Path (Join-Path $backendDir "pdf-merge-worker\target") -Filter "*.jar" -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $apiJar) { throw "Cannot find pdf-merge-api jar package" }
  if (-not $workerJar) { throw "Cannot find pdf-merge-worker jar package" }

  Copy-Item $apiJar.FullName -Destination (Join-Path $backendDist "pdf-merge-api.jar") -Force
  Copy-Item $workerJar.FullName -Destination (Join-Path $backendDist "pdf-merge-worker.jar") -Force

  # frontend standalone
  $frontendDist = Join-Path $DistDirAbs "frontend"
  New-Item -ItemType Directory -Force -Path $frontendDist | Out-Null

  $standaloneDir = Join-Path $frontendDir ".next\standalone"
  $staticDir = Join-Path $frontendDir ".next\static"
  $publicDir = Join-Path $frontendDir "public"

  Copy-DirIfExists $standaloneDir (Join-Path $frontendDist "")
  Copy-DirIfExists $staticDir (Join-Path $frontendDist ".next\static")
  Copy-DirIfExists $publicDir (Join-Path $frontendDist "public")

  # export env hint
  $hint = @"
Deploy hint:
1) After starting backend, worker requires Redis Stream and MySQL to be available.
2) Frontend calls backend at NEXT_PUBLIC_MERGE_API_BASE (default: http://localhost:8080/api/v1/pdf/merge).
3) Backend needs MySQL/Redis configuration (application.yml defaults are for local dev only).
"@
  Set-Content -Path (Join-Path $DistDirAbs "DEPLOY_HINT.txt") -Value $hint -Encoding UTF8
}

if ($Mode -eq "deploy") {
  Write-Host "===> Starting backend and frontend (start processes only)"
  $backendDist = Join-Path $DistDirAbs "backend"
  $frontendDist = Join-Path $DistDirAbs "frontend"

  $apiJarPath = Join-Path $backendDist "pdf-merge-api.jar"
  $workerJarPath = Join-Path $backendDist "pdf-merge-worker.jar"

  Write-Host "Starting: pdf-merge-api"
  Start-Process -FilePath "java" -ArgumentList "-jar `"$apiJarPath`"" -NoNewWindow

  Write-Host "Starting: pdf-merge-worker"
  Start-Process -FilePath "java" -ArgumentList "-jar `"$workerJarPath`" --spring.profiles.active=worker" -NoNewWindow

  Write-Host "Starting: pdf-merge-web (Next standalone)"
  $serverJs = Join-Path $frontendDist "server.js"
  if (-not (Test-Path $serverJs)) {
    throw "Cannot find Next standalone server.js: $serverJs"
  }
  Push-Location $frontendDist
  try {
    Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
  } finally {
    Pop-Location
  }
}

Write-Host "===> Done"

