#!/usr/bin/env node

/**
 * Schema-aware dev runner.
 * Ensures Prisma client is generated for the active PRISMA_SCHEMA before next dev starts.
 */

const { spawn, spawnSync } = require('child_process');
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

function fail(message, details) {
  console.error(message, details || '');
  process.exit(1);
}

const isWindows = process.platform === 'win32';

const generate = spawnSync('npx', ['prisma', 'generate', '--schema', schema], {
  cwd,
  env: runtimeEnv,
  stdio: 'inherit',
  shell: isWindows,
});

if (generate.error) {
  fail('Prisma generate failed to start.', generate.error.message);
}

if (typeof generate.status === 'number' && generate.status !== 0) {
  fail('Prisma generate failed.', { schema, status: generate.status });
}

const devArgs = ['dev', ...process.argv.slice(2)];

const devServer = spawn('next', devArgs, {
  cwd,
  env: runtimeEnv,
  stdio: 'inherit',
  shell: isWindows,
});

devServer.on('error', (error) => {
  fail('next dev failed to start.', error.message);
});

devServer.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
