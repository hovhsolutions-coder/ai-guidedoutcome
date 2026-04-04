#!/usr/bin/env node

/**
 * Schema-aware build runner.
 * Uses PRISMA_SCHEMA when provided, otherwise defaults to prisma/schema.prisma.
 * Runs db push + client generate with that schema, then Next build.
 */

const { execSync } = require('child_process');
const cwd = process.cwd();

const schema = (process.env.PRISMA_SCHEMA || 'prisma/schema.prisma').trim();
const skipDbPush = ((process.env.SKIP_DB_PUSH || '').trim()) === '1';

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
  const useDirect = Boolean(process.env.DIRECT_URL);
  const envForPush = {
    ...process.env,
    DATABASE_URL: useDirect ? process.env.DIRECT_URL : process.env.DATABASE_URL,
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
