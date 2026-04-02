const { spawnSync } = require('child_process');
const path = require('path');

const suspectSuites = [
  { name: 'sparse-state-matrix', file: 'tests/evals/guidance-sparse-state-matrix.test.cjs', fn: 'runGuidanceSparseStateMatrixTests' },
  { name: 'presentation-matrix', file: 'tests/evals/guidance-presentation-matrix.test.cjs', fn: 'runGuidancePresentationMatrixTests' },
  { name: 'shell-render-matrix', file: 'tests/evals/guidance-shell-render-matrix.test.cjs', fn: 'runGuidanceShellRenderMatrixTests' },
];

console.log('=== Subprocess Isolation Test for Suspect Suites ===\n');

let passed = 0;
let failed = 0;

for (const suite of suspectSuites) {
  process.stdout.write(`${suite.name} (subprocess)... `);
  
  const result = spawnSync('node', ['-e', `
    require('./tests/helpers/register-ts-runtime.cjs');
    const { ${suite.fn} } = require('./${suite.file}');
    ${suite.fn}();
    console.log('PASS');
  `], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 60000,
  });
  
  if (result.status === 0 && result.stdout.includes('PASS')) {
    console.log('PASS');
    passed++;
  } else {
    console.log('FAIL');
    if (result.stderr) console.log('  stderr:', result.stderr.substring(0, 200));
    failed++;
  }
}

console.log(`\n=== Subprocess Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
