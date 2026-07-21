@echo off
setlocal EnableExtensions
echo ============================================
echo  Fix Docker Engine (500 pipe error)
echo  Run CMD as Administrator
echo ============================================
echo.

set "DOCKER_BIN=C:\Program Files\Docker\Docker\resources\bin"
set "PATH=%DOCKER_BIN%;%PATH%"

echo [1] Shutting down WSL...
wsl --shutdown 2>nul

echo [2] Stopping Docker Desktop...
taskkill /IM "Docker Desktop.exe" /F 2>nul
taskkill /IM "com.docker.backend.exe" /F 2>nul
timeout /t 3 /nobreak >nul

echo [3] Starting Docker service...
sc start com.docker.service 2>nul

echo [4] Starting Docker Desktop...
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) else (
  echo ERROR: Docker Desktop not found. Reinstall from https://www.docker.com/products/docker-desktop/
  goto end
)

echo [5] Waiting for engine (up to 4 minutes)...
set /a n=0
:wait_loop
set /a n+=1
docker version >nul 2>&1
if %errorlevel%==0 goto engine_ok
if %n% GEQ 48 goto engine_fail
echo   still starting... (%n%/48)
timeout /t 5 /nobreak >nul
goto wait_loop

:engine_ok
echo.
echo SUCCESS: Docker engine is running.
docker version
echo.
echo Now run from project root:
echo   docker compose -f docker/docker-compose.yml up -d postgres redis
goto end

:engine_fail
echo.
echo FAILED: Engine still not running.
echo.
echo Try these in order:
echo   A) Docker Desktop - Settings - General - "Use WSL 2 based engine" ON
echo   B) CMD as Admin:  wsl --install
echo      then REBOOT and run this script again
echo   C) Enable VT-x/AMD-V in BIOS
echo   D) Docker Desktop - Troubleshoot - Restart / Reset to factory defaults
echo   E) Check %%USERPROFILE%%\.wslconfig - remove custom kernel= line if present
echo.
docker version 2>&1

:end
echo.
pause
