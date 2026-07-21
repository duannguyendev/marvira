@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================
echo  Marvira - Native Windows Setup (no Docker)
echo ============================================
echo.

where winget >nul 2>&1
if errorlevel 1 (
  echo ERROR: winget is required. Install PostgreSQL and Redis manually.
  goto manual
)

echo [1/6] Installing PostgreSQL 17 (if missing)...
where psql >nul 2>&1
if errorlevel 1 (
  winget install PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
  echo Add PostgreSQL bin to PATH, e.g.:
  echo   set PATH=C:\Program Files\PostgreSQL\17\bin;%%PATH%%
) else (
  echo PostgreSQL already on PATH.
)

echo.
echo [2/6] Installing Memurai Redis (if missing)...
sc query Memurai >nul 2>&1
if errorlevel 1 (
  winget install Memurai.MemuraiDeveloper --accept-package-agreements --accept-source-agreements
) else (
  echo Memurai service found.
)

echo.
echo [3/6] Starting Redis/Memurai service...
sc start Memurai >nul 2>&1
sc start Redis >nul 2>&1

echo.
echo [4/6] Creating database user and database...
set "PGPATH=C:\Program Files\PostgreSQL\17\bin"
if exist "%PGPATH%\psql.exe" set "PATH=%PGPATH%;%PATH%"

psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='marvira'" | findstr /c:"1" >nul
if errorlevel 1 (
  echo When prompted, use your postgres superuser password set during install.
  psql -U postgres -c "CREATE USER marvira WITH PASSWORD 'marvira' CREATEDB;"
)
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='marvira'" | findstr /c:"1" >nul
if errorlevel 1 (
  psql -U postgres -c "CREATE DATABASE marvira OWNER marvira;"
)

echo.
echo [5/6] Installing dependencies and migrating...
call pnpm install
call pnpm --filter @marvira/shared-types build
call pnpm --filter @marvira/shared-utils build
cd apps\api
call npx prisma generate
call npx prisma migrate deploy
call pnpm run seed
cd ..\..

echo.
echo [6/6] Setup complete!
echo.
echo Start in two terminals:
echo   pnpm dev:api
echo   pnpm dev:dashboard
echo.
echo Dashboard: http://localhost:3000
echo API:       http://localhost:3001
echo Admin:     admin@marvira.com / admin123
goto end

:manual
echo Install manually:
echo   PostgreSQL 17 - https://www.postgresql.org/download/windows/
echo   Memurai Dev   - https://www.memurai.com/
echo Then set DATABASE_URL in apps\api\.env and run:
echo   pnpm install
echo   pnpm --filter @marvira/api exec prisma migrate deploy
echo   pnpm db:seed

:end
pause
