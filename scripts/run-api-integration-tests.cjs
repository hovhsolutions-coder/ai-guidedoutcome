#!/usr/bin/env node
/**
 * API Integration Test Runner with Production Server
 * 
 * This script:
 * 1. Checks if server is already running
 * 2. If not: runs `npm run build` then starts production server
 * 3. Runs the integration tests
 * 4. Shuts down the server
 * 
 * Uses production server (next start) for deterministic startup,
 * avoiding the variable timing of next dev.
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = 3000;
const MAX_RETRIES = 15;
const RETRY_INTERVAL = 2000;

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/dossiers`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer() {
  console.log('⏳ Waiting for server to be ready...');
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await checkServerReady()) {
      console.log('✅ Server ready\n');
      return true;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, RETRY_INTERVAL));
  }
  console.log('\n❌ Server failed to start');
  return false;
}

async function runIntegrationTests() {
  console.log('🔍 Running API integration tests...\n');
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/integration-test-api.cjs'], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Integration tests failed with code ${code}`));
      }
    });
  });
}

function runBuild() {
  console.log('📦 Building application...');
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const child = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: isWindows,
      env: { ...process.env, NODE_ENV: 'production' },
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build complete\n');
        resolve();
      } else {
        console.error('❌ Build failed:\n', output.slice(-500));
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

function startProductionServer() {
  console.log('🚀 Starting production server...');
  const isWindows = process.platform === 'win32';
  const server = spawn('npm', ['run', 'start'], {
    stdio: 'pipe',
    shell: isWindows,
    env: { ...process.env, NODE_ENV: 'production' },
  });

  // Capture output for debugging
  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  server.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });

  return { server, output: () => serverOutput };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('API Integration Test Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check if server is already running
  console.log('🔍 Checking for existing server...');
  const isRunning = await checkServerReady();
  let server = null;
  let serverOutput = null;
  
  if (isRunning) {
    console.log('✅ Using existing server on port ' + PORT + '\n');
  } else {
    // Build and start production server
    try {
      await runBuild();
      const serverInfo = startProductionServer();
      server = serverInfo.server;
      serverOutput = serverInfo.output;
      
      // Wait for server
      const ready = await waitForServer();
      if (!ready) {
        console.error('[DEBUG] Server output:\n', serverOutput().slice(-500));
        throw new Error('Server failed to start');
      }
    } catch (error) {
      console.error('\n❌', error.message);
      if (server) server.kill('SIGTERM');
      process.exit(1);
    }
  }

  // Run tests
  try {
    await runIntegrationTests();
    console.log('\n✅ API integration tests passed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌', error.message);
    process.exit(1);
  } finally {
    if (server) {
      console.log('\n🛑 Shutting down server...');
      server.kill('SIGTERM');
    }
  }
}

main();
