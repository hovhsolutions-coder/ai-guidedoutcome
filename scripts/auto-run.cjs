/**
 * Auto-run verification script
 * Runs build → unit/integration tests (if available) → e2e tests in sequence
 * Cross-platform solution for Windows/macOS/Linux
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? true : false;
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: shell,
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

function runNpmScript(scriptName) {
  return runCommand('npm', ['run', scriptName]);
}

function checkScriptExists(scriptName) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return !!packageJson.scripts?.[scriptName];
  } catch {
    return false;
  }
}

function checkUnitTestsAvailable() {
  // Check for common test frameworks
  const testFiles = [
    'jest.config.js',
    'jest.config.ts',
    'vitest.config.js',
    'vitest.config.ts',
    'playwright.config.ts',
    'playwright.config.js',
  ];
  
  const hasTestConfig = testFiles.some(file => fs.existsSync(path.join(process.cwd(), file)));
  const hasTestScript = checkScriptExists('test') || checkScriptExists('test:unit') || checkScriptExists('test:integration');
  
  return hasTestConfig && hasTestScript;
}

async function main() {
  log('\n🚀 Running automated verification...\n', 'bright');
  
  const startTime = Date.now();
  
  // Step 1: Build
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('STEP 1: Build', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    if (checkScriptExists('build')) {
      await runNpmScript('build');
      log('\n✅ Build passed\n', 'green');
    } else {
      log('⚠️  No build script found, skipping...', 'yellow');
    }
  } catch (error) {
    log('\n❌ Build failed\n', 'red');
    process.exit(1);
  }
  
  // Step 2: Unit/Integration tests
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('STEP 2: Unit/Integration Tests', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  let unitTestsRun = false;
  
  // Check for specific test scripts in order of preference
  const testScripts = ['test', 'test:unit', 'test:integration'];
  for (const script of testScripts) {
    if (checkScriptExists(script)) {
      try {
        await runNpmScript(script);
        log(`\n✅ ${script} passed\n`, 'green');
        unitTestsRun = true;
        break;
      } catch (error) {
        log(`\n❌ ${script} failed\n`, 'red');
        process.exit(1);
      }
    }
  }
  
  if (!unitTestsRun) {
    log('ℹ️  No unit/integration tests configured, skipping...', 'yellow');
    log('   (Add a "test" script to package.json to enable)\n', 'yellow');
  }
  
  // Step 3: E2E tests
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('STEP 3: E2E Tests', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    if (checkScriptExists('e2e')) {
      await runNpmScript('e2e');
      log('\n✅ E2E tests passed\n', 'green');
    } else {
      log('ℹ️  No e2e script found, skipping...', 'yellow');
      log('   (Add an "e2e" script to package.json to enable)\n', 'yellow');
    }
  } catch (error) {
    log('\n❌ E2E tests failed\n', 'red');
    process.exit(1);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log(`✅ All verification steps passed (${duration}s)`, 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log('');
}

main().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}\n`, 'red');
  process.exit(1);
});
