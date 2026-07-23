# Database Backup & Disaster Recovery

## Automated backups (managed Postgres)

For AWS RDS, Google Cloud SQL, or similar:

1. Enable **automated daily snapshots**
2. Enable **point-in-time recovery (PITR)** with retention ≥ 7 days
3. Store backups in a different region/account when possible

## Manual backup

```bash
pg_dump "$DATABASE_URL" -Fc -f marvira_backup_$(date +%Y%m%d).dump
```

## Restore procedure

1. Create a new empty database (or stop API traffic to target DB)
2. Restore:

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists marvira_backup_YYYYMMDD.dump
```

3. Run migrations if restoring to an older snapshot:

```bash
pnpm --filter @marvira/api exec prisma migrate deploy
```

4. Verify readiness: `GET /ready`
5. Smoke test: login, unlock place, submit answer

## Redis

Redis holds rate-limit keys and cache — safe to rebuild on loss. No user data backup required for go-live.

## Uploads

When using local disk, back up `apps/api/uploads/` with object-storage sync. In production, use S3 versioning on the bucket.

## RTO / RPO targets (recommended)

| Metric                | Target                         |
| --------------------- | ------------------------------ |
| RPO (max data loss)   | ≤ 1 hour (PITR)                |
| RTO (time to restore) | ≤ 4 hours (documented runbook) |

Test a restore in staging at least once before launch.
