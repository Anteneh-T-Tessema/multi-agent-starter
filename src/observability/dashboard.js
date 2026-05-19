/**
 * Observability Dashboard — prints a live summary of recent trace events
 */
const fs = require('fs');
const path = require('path');

const tracesDir = path.join(__dirname, '../../agent_skills/observability/traces');

function loadTraces() {
  if (!fs.existsSync(tracesDir)) return [];
  return fs.readdirSync(tracesDir)
    .filter(f => f.endsWith('.json') || f.endsWith('.jsonl'))
    .flatMap(f => {
      try {
        const raw = fs.readFileSync(path.join(tracesDir, f), 'utf8');
        return raw.trim().split('\n').map(line => JSON.parse(line));
      } catch { return []; }
    });
}

function summarise(events) {
  const spans    = events.filter(e => e.event === 'span.start').length;
  const decisions = events.filter(e => e.event === 'decision').length;
  const tokens   = events.filter(e => e.event === 'tokens');
  const totalIn  = tokens.reduce((s, e) => s + (e.inputTokens  || 0), 0);
  const totalOut = tokens.reduce((s, e) => s + (e.outputTokens || 0), 0);
  return { spans, decisions, totalIn, totalOut, eventCount: events.length };
}

function render(summary) {
  console.log('\n=== Multi-Agent Observability Dashboard ===');
  console.log(`  Total events  : ${summary.eventCount}`);
  console.log(`  Spans started : ${summary.spans}`);
  console.log(`  Decisions     : ${summary.decisions}`);
  console.log(`  Input tokens  : ${summary.totalIn}`);
  console.log(`  Output tokens : ${summary.totalOut}`);
  console.log('===========================================\n');
}

const events  = loadTraces();
const summary = summarise(events);
render(summary);
