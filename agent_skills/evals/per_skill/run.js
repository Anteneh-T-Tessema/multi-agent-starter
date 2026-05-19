/**
 * Per-skill eval runner — executes evals scoped to individual skills
 */
const fs   = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname);

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

async function main() {
  const skill = process.argv[2];
  const targetDir = skill ? path.join(skillsDir, skill) : skillsDir;
  console.log(`\n=== Per-Skill Eval Runner${skill ? ': ' + skill : ''} ===`);
  const cases = loadCases(targetDir);
  if (cases.length === 0) {
    console.log('No eval cases found — add .json files to agent_skills/evals/per_skill/');
    return;
  }
  let passed = 0, failed = 0;
  for (const c of cases) {
    const ok = typeof c.expected !== 'undefined'
      ? JSON.stringify(c.actual) === JSON.stringify(c.expected)
      : true;
    if (ok) { passed++; console.log(`  PASS  ${c.name || 'unnamed'}`); }
    else    { failed++; console.log(`  FAIL  ${c.name || 'unnamed'}`); }
  }
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
