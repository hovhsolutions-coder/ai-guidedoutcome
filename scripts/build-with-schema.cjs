#!/usr/bin/env node

/**
 * Schema-aware build runner.
 * Uses PRISMA_SCHEMA when provided, otherwise defaults to prisma/schema.prisma.
 * Runs db push + client generate with that schema, then Next build.
 */

const { execSync } = require('child_process');
const cwd = process.cwd();

const schema = process.env.PRISMA_SCHEMA || 'prisma/schema.prisma';
const skipDbPush = process.env.SKIP_DB_PUSH === '1';

function run(step, cmd) {
  console.log(`\n▶️ ${step}: ${cmd}`);
  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: process.env,
      cwd,
    });
  } catch (err) {
    console.error(`❌ ${step} failed`, { step, cmd, schema, skipDbPush, cwd, message: err?.message });
    throw err;
  }
}

console.log('┌ Schema-aware build');
console.log(`├ PRISMA_SCHEMA: ${schema}`);
console.log(`├ SKIP_DB_PUSH: ${skipDbPush ? '1' : '0'}`);
console.log(`└ CWD: ${cwd}`);

if (!skipDbPush) {
  run('prisma db push', `npx prisma db push --schema ${schema}`);
} else {
  console.log('↷ Skipping prisma db push (SKIP_DB_PUSH=1)');
}

run('prisma generate', `npx prisma generate --schema ${schema}`);
run('next build', 'next build');
