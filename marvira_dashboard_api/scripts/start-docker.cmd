@echo off
setlocal EnableExtensions

echo ============================================
echo  Marvira - Docker setup (run as Administrator)
echo ============================================
echo.

:: 1) Enable required Windows features for Docker/WSL2
echo [1/5] Enabling Windows features (WSL, Virtual Machine Platform)...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
if errorlevel 1 (
  echo WARNING: Could not enable Windows features. Run this script as Administrator.
)

:: 2) Install/update WSL2
echo.
echo [2/5] Installing WSL2...
wsl --install --no-distribution
if errorlevel 1 (
  echo NOTE: If WSL install failed, you may need a reboot first, then run this script again.
)

:: 3) Start Docker Desktop (if installed)
echo.
echo [3/5] Starting Docker Desktop...
set "DOCKER_DESKTOP=C:\Program Files\Docker\Docker\Docker Desktop.exe"
if exist "%DOCKER_DESKTOP%" (
  start "" "%DOCKER_DESKTOP%"
  echo Docker Desktop launched. Wait until the whale icon shows "Engine running".
) else (
  echo Docker Desktop not found at:
  echo   %DOCKER_DESKTOP%
  echo Install it with:
  echo   winget install Docker.DockerDesktop --accept-package-agreements
)

:: 4) Wait for docker CLI
echo.
echo [4/5] Waiting for Docker engine (up to 3 minutes)...
set "DOCKER_BIN=C:\Program Files\Docker\Docker\resources\bin"
set "PATH=%DOCKER_BIN%;%PATH%"

set /a tries=0
:wait_docker
set /a tries+=1
docker version >nul 2>&1
if %errorlevel%==0 goto docker_ready
if %tries% GEQ 36 (
  echo.
  echo ERROR: Docker engine did not start.
  echo.
  echo Common fixes:
  echo   1. Enable Intel VT-x / AMD-V in BIOS
  echo   2. Reboot after WSL install
  echo   3. Open Docker Desktop manually and finish setup
  echo   4. Sign in to Docker Desktop if prompted
  goto end
)
echo   waiting... (%tries%/36)
timeout /t 5 /nobreak >nul
goto wait_docker

:docker_ready
echo Docker is ready.

:: 5) Start postgres + redis for this project
echo.
echo [5/5] Starting postgres and redis...
cd /d "%~dp0.."
docker compose -f docker/docker-compose.yml up -d postgres redis
if errorlevel 1 (
  echo ERROR: docker compose failed.
  goto end
)

docker compose -f docker/docker-compose.yml ps

echo.
echo ============================================
echo  Done. Next steps:
echo    pnpm --filter @marvira/api exec prisma migrate deploy
echo    pnpm db:seed
echo    pnpm dev:api
echo    pnpm dev:dashboard
echo ============================================

:end
echo.
pause
