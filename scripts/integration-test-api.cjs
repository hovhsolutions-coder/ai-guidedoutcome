#!/usr/bin/env node
/**
 * Integration test: API roundtrip verification against running dev server
 * 
 * This test verifies:
 * 1. GET /api/dossiers returns SQLite-backed data
 * 2. POST /api/dossiers creates a dossier in SQLite
 * 3. PATCH /api/dossiers/[id] updates dossier fields
 * 4. Subsequent GET reflects the changes
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runIntegrationTests() {
  console.log('🔍 API Roundtrip Integration Tests\n');
  console.log(`Target: http://${BASE_URL}:${PORT}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: List dossiers
  try {
    console.log('Test 1: GET /api/dossiers');
    const list = await makeRequest('GET', '/api/dossiers');
    if (list.status === 200 && list.data.success && Array.isArray(list.data.data)) {
      console.log(`  ✓ Returned ${list.data.data.length} dossiers from SQLite`);
      results.passed++;
      results.tests.push({ name: 'List dossiers', status: 'passed' });
    } else {
      console.log(`  ✗ Unexpected response: ${JSON.stringify(list.data).slice(0, 100)}`);
      results.failed++;
      results.tests.push({ name: 'List dossiers', status: 'failed' });
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'List dossiers', status: 'failed', error: err.message });
  }

  // Test 2: Create dossier
  let createdId = null;
  try {
    console.log('\nTest 2: POST /api/dossiers');
    const createData = {
      title: 'Integration Test Dossier',
      situation: 'Testing the API roundtrip',
      main_goal: 'Verify SQLite persistence',
      phase: 'Understanding',
      suggested_tasks: ['Task A', 'Task B'],
    };
    const create = await makeRequest('POST', '/api/dossiers', createData);
    if (create.status === 200 && create.data.success && create.data.data?.id) {
      createdId = create.data.data.id;
      console.log(`  ✓ Created dossier with ID: ${createdId}`);
      results.passed++;
      results.tests.push({ name: 'Create dossier', status: 'passed' });
    } else {
      console.log(`  ✗ Unexpected response: ${JSON.stringify(create.data).slice(0, 100)}`);
      results.failed++;
      results.tests.push({ name: 'Create dossier', status: 'failed' });
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'Create dossier', status: 'failed', error: err.message });
  }

  // Test 3: Verify creation in list
  if (createdId) {
    try {
      console.log('\nTest 3: Verify created dossier appears in list');
      const list = await makeRequest('GET', '/api/dossiers');
      const found = list.data.data?.find((d) => d.id === createdId);
      if (found) {
        console.log(`  ✓ Found created dossier in list: ${found.title}`);
        results.passed++;
        results.tests.push({ name: 'Verify in list', status: 'passed' });
      } else {
        console.log(`  ✗ Created dossier not found in list`);
        results.failed++;
        results.tests.push({ name: 'Verify in list', status: 'failed' });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'Verify in list', status: 'failed', error: err.message });
    }
  }

  // Test 4: Update dossier
  if (createdId) {
    try {
      console.log('\nTest 4: PATCH /api/dossiers/[id]');
      const updateData = {
        title: 'Updated Integration Test Dossier',
        progress: 50,
      };
      const update = await makeRequest('PATCH', `/api/dossiers/${createdId}`, updateData);
      if (update.status === 200 && update.data.success) {
        console.log(`  ✓ Updated dossier`);
        results.passed++;
        results.tests.push({ name: 'Update dossier', status: 'passed' });
      } else {
        console.log(`  ✗ Unexpected response: ${JSON.stringify(update.data).slice(0, 100)}`);
        results.failed++;
        results.tests.push({ name: 'Update dossier', status: 'failed' });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'Update dossier', status: 'failed', error: err.message });
    }
  }

  // Test 5: PATCH tasks persistence contract
  if (createdId) {
    try {
      console.log('\nTest 5: PATCH /api/dossiers/[id] persists tasks');
      const updateData = {
        tasks: [
          { name: 'Contract Test Task A', priority: 'high' },
          { name: 'Contract Test Task B', priority: 'medium' },
        ],
      };
      const update = await makeRequest('PATCH', `/api/dossiers/${createdId}`, updateData);
      if (update.status === 200 && update.data.success) {
        // Verify by fetching the dossier again
        const get = await makeRequest('GET', `/api/dossiers/${createdId}`);
        const tasks = get.data.data?.tasks;
        if (
          Array.isArray(tasks) &&
          tasks.length === 2 &&
          tasks.some((t) => t.name === 'Contract Test Task A') &&
          tasks.some((t) => t.name === 'Contract Test Task B')
        ) {
          console.log(`  ✓ Tasks persisted and retrievable`);
          results.passed++;
          results.tests.push({ name: 'PATCH persists tasks', status: 'passed' });
        } else {
          console.log(`  ✗ Tasks not found after PATCH`);
          results.failed++;
          results.tests.push({ name: 'PATCH persists tasks', status: 'failed' });
        }
      } else {
        console.log(`  ✗ PATCH failed: ${JSON.stringify(update.data).slice(0, 100)}`);
        results.failed++;
        results.tests.push({ name: 'PATCH persists tasks', status: 'failed' });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'PATCH persists tasks', status: 'failed', error: err.message });
    }
  }

  // Test 6: PATCH completedTasks persistence contract
  if (createdId) {
    try {
      console.log('\nTest 6: PATCH /api/dossiers/[id] persists completedTasks');
      const updateData = {
        completedTasks: ['Contract Test Task A'],
      };
      const update = await makeRequest('PATCH', `/api/dossiers/${createdId}`, updateData);
      if (update.status === 200 && update.data.success) {
        // Verify by fetching the dossier again
        const get = await makeRequest('GET', `/api/dossiers/${createdId}`);
        const completed = get.data.data?.completedTasks;
        if (Array.isArray(completed) && completed.includes('Contract Test Task A')) {
          console.log(`  ✓ completedTasks persisted and retrievable`);
          results.passed++;
          results.tests.push({ name: 'PATCH persists completedTasks', status: 'passed' });
        } else {
          console.log(`  ✗ completedTasks not found after PATCH`);
          results.failed++;
          results.tests.push({ name: 'PATCH persists completedTasks', status: 'failed' });
        }
      } else {
        console.log(`  ✗ PATCH failed: ${JSON.stringify(update.data).slice(0, 100)}`);
        results.failed++;
        results.tests.push({ name: 'PATCH persists completedTasks', status: 'failed' });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.failed++;
      results.tests.push({
        name: 'PATCH persists completedTasks',
        status: 'failed',
        error: err.message,
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Total: ${results.passed + results.failed}`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch((err) => {
  console.error('Integration tests failed:', err);
  process.exit(1);
});
