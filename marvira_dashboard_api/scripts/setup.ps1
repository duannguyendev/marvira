$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

Write-Host "Starting PostgreSQL and Redis..."
docker compose -f docker/docker-compose.yml up -d postgres redis

Write-Host "Waiting for PostgreSQL..."
do {
    Start-Sleep -Seconds 2
    $ready = docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U marvira 2>$null
} while ($LASTEXITCODE -ne 0)

$env:DATABASE_URL = "postgresql://marvira:marvira@localhost:5432/marvira?schema=public"
$env:REDIS_URL = "redis://localhost:6379"

pnpm install
pnpm --filter @marvira/shared-types build
pnpm --filter @marvira/shared-utils build
pnpm --filter @marvira/api exec prisma migrate deploy
pnpm db:seed

Write-Host ""
Write-Host "Setup complete!"
Write-Host "  API:       pnpm dev:api       -> http://localhost:3001"
Write-Host "  Dashboard: pnpm dev:dashboard -> http://localhost:3000"
Write-Host "  Swagger:   http://localhost:3001/docs"
Write-Host "  Admin:     admin@marvira.com / admin123"
