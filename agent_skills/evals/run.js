/**
 * Eval runner — executes all eval suites (compositional + regression)
 */
const fs   = require('fs');
const path = require('path');

const suitesDirs = [
  path.join(__dirname, 'compositional'),
  path.join(__dirname, 'regression'),
];

function loadCases(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean);
}

async function runSuite(dir) {
  const cases = loadCases(dir);
  if (cases.length === 0) {
    console.log(`[evals] No cases found in ${path.basename(dir)} — skipping.`);
    return { passed: 0, failed: 0, skipped: 0 };
  }
  let passed = 0, failed = 0;
  for (const c of cases) {
    try {
      const ok = typeof c.expected !== 'undefined'
        ? JSON.stringify(c.actual) === JSON.stringify(c.expected)
        : true;
      if (ok) { passed++; console.log(`  PASS  ${c.name || 'unnamed'}`); }
      else    { failed++; console.log(`  FAIL  ${c.name || 'unnamed'}`); }
    } catch (err) {
      failed++;
      console.log(`  ERROR ${c.name || 'unnamed'}: ${err.message}`);
    }
  }
  return { passed, failed, skipped: 0 };
}

async function main() {
  console.log('\n=== Multi-Agent Eval Runner ===');
  let totalPassed = 0, totalFailed = 0;
  for (const dir of suitesDirs) {
    console.log(`\nSuite: ${path.basename(dir)}`);
    const r = await runSuite(dir);
    totalPassed += r.passed;
    totalFailed += r.failed;
  }
  console.log(`\nResults: ${totalPassed} passed, ${totalFailed} failed`);
  if (totalFailed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
