#!/usr/bin/env node

/**
 * Schema-aware build runner.
 * Uses PRISMA_SCHEMA when provided, otherwise defaults to prisma/schema.prisma.
 * Runs db push + client generate with that schema, then Next build.
 */

const { execSync } = require('child_process');
const path = require('path');

const schema = process.env.PRISMA_SCHEMA || 'prisma/schema.prisma';
const skipDbPush = process.env.SKIP_DB_PUSH === '1';

function run(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
}

console.log(`ℹ️ Using Prisma schema: ${schema}`);
if (skipDbPush) {
  console.log('ℹ️ SKIP_DB_PUSH=1 -> skipping prisma db push');
}

// Keep local/dev SQLite working; allow prod to swap in Postgres schema via PRISMA_SCHEMA.
if (!skipDbPush) {
  run(`npx prisma db push --schema ${schema}`);
}
run(`npx prisma generate --schema ${schema}`);
run('next build');
