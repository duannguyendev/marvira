/**
 * Set Cache-Control on existing R2/S3 objects under uploads/.
 *
 * Run from apps/api (loads .env / ../../.env):
 *   node scripts/backfill-upload-cache-control.mjs
 *   node scripts/backfill-upload-cache-control.mjs --dry-run
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';

const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PREFIX = 'uploads/';
const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const raw of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, '../.env'));
loadEnvFile(resolve(__dirname, '../../../.env'));

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || 'us-east-1';
const endpoint = process.env.S3_ENDPOINT || undefined;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error(
    'Missing S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in env',
  );
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: !!endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

async function listKeys() {
  const keys = [];
  let continuationToken;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of page.Contents || []) {
      if (obj.Key && !obj.Key.endsWith('/')) {
        keys.push(obj.Key);
      }
    }
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
  return keys;
}

async function needsUpdate(key) {
  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );
  return {
    needsUpdate: head.CacheControl !== CACHE_CONTROL,
    contentType: head.ContentType,
    cacheControl: head.CacheControl,
  };
}

async function applyCacheControl(key, contentType) {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`,
      MetadataDirective: 'REPLACE',
      CacheControl: CACHE_CONTROL,
      ContentType: contentType || 'application/octet-stream',
    }),
  );
}

async function main() {
  console.log(
    `Backfill Cache-Control on s3://${bucket}/${PREFIX}*${dryRun ? ' (dry-run)' : ''}`,
  );
  const keys = await listKeys();
  console.log(`Found ${keys.length} object(s)`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of keys) {
    try {
      const meta = await needsUpdate(key);
      if (!meta.needsUpdate) {
        skipped += 1;
        continue;
      }
      if (dryRun) {
        console.log(`[dry-run] would update ${key} (was: ${meta.cacheControl || 'none'})`);
        updated += 1;
        continue;
      }
      await applyCacheControl(key, meta.contentType);
      console.log(`updated ${key}`);
      updated += 1;
    } catch (err) {
      failed += 1;
      console.error(`failed ${key}:`, err?.message || err);
    }
  }

  console.log(
    `Done. updated=${updated} skipped=${skipped} failed=${failed}${dryRun ? ' (dry-run)' : ''}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
