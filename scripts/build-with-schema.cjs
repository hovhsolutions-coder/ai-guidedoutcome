#!/usr/bin/env node

/**
 * Schema-aware build runner.
 * Uses PRISMA_SCHEMA when provided, otherwise defaults to prisma/schema.prisma.
 * Runs db push + client generate with that schema, then Next build.
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');
const dotenv = require('dotenv');
const cwd = process.cwd();

function buildRuntimeEnv() {
  const runtimeEnv = { ...process.env };

  for (const envFile of ['.env', '.env.local']) {
    const fullPath = resolve(cwd, envFile);
    if (!existsSync(fullPath)) {
      continue;
    }

    const parsed = dotenv.parse(readFileSync(fullPath));
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        runtimeEnv[key] = value;
      }
    }
  }

  return runtimeEnv;
}

const runtimeEnv = buildRuntimeEnv();
const schema = (runtimeEnv.PRISMA_SCHEMA || 'prisma/schema.prisma').trim();
const skipDbPush = ((runtimeEnv.SKIP_DB_PUSH || '').trim()) === '1';

function run(step, cmd) {
  console.log(`\n▶️ ${step}: ${cmd}`);
  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: runtimeEnv,
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
  const useDirect = Boolean(runtimeEnv.DIRECT_URL);
  const envForPush = {
    ...runtimeEnv,
    DATABASE_URL: useDirect ? runtimeEnv.DIRECT_URL : runtimeEnv.DATABASE_URL,
  };
  console.log(`├ db push URL source: ${useDirect ? 'DIRECT_URL (override)' : 'DATABASE_URL (default)'}`);
  try {
    execSync(`npx prisma db push --schema ${schema}`, {
      stdio: 'inherit',
      env: envForPush,
      cwd,
    });
  } catch (err) {
    console.error(`❌ prisma db push failed`, { schema, skipDbPush, cwd, useDirect, message: err?.message });
    throw err;
  }
} else {
  console.log('↷ Skipping prisma db push (SKIP_DB_PUSH=1)');
}

run('prisma generate', `npx prisma generate --schema ${schema}`);
run('next build', 'next build');
