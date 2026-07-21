@echo off
:: Quick start - use AFTER Docker Desktop is already running
set "DOCKER_BIN=C:\Program Files\Docker\Docker\resources\bin"
set "PATH=%DOCKER_BIN%;%PATH%"

cd /d "%~dp0.."

echo Starting postgres and redis...
docker compose -f docker/docker-compose.yml up -d postgres redis
docker compose -f docker/docker-compose.yml ps
