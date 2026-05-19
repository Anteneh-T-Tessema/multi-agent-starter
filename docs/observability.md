# Observability

**Tracer:** [src/observability/index.js](../src/observability/index.js)  
**Dashboard:** [src/observability/dashboard.js](../src/observability/dashboard.js)  
**Trace files:** `agent_skills/observability/traces/`

Every request produces a chain of structured JSON events on stdout. The dashboard aggregates them into a summary.

---

## Event schema

All events share a common envelope:

```json
{
  "event": "span.start",
  "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "ts": 1716134400000
}
```

### Event types

| Event | Extra fields | When emitted |
|-------|-------------|--------------|
| `span.start` | `name` | Start of a logical operation |
| `span.end` | — | End of that operation |
| `decision` | `decision`, `rationale` | Agent makes a routing or model choice |
| `tokens` | `inputTokens`, `outputTokens` | After every LLM call |

---

## Using the Tracer

```js
const { Tracer } = require('./observability');
const tracer = new Tracer();

// In orchestrator.run():
const traceId = crypto.randomUUID();

tracer.startSpan(traceId, 'orchestrate');

tracer.logDecision(
  traceId,
  'route:rag-agent',
  'query contains retrieval intent'
);

tracer.recordTokens(traceId, 512, 128);

tracer.endSpan(traceId);
```

All output is newline-delimited JSON (NDJSON), easy to pipe to any log aggregator.

---

## Dashboard

Run `npm run observe` to print a summary of all saved trace files:

```
=== Multi-Agent Observability Dashboard ===
  Total events  : 42
  Spans started : 12
  Decisions     : 8
  Input tokens  : 14 320
  Output tokens : 3 891
===========================================
```

The dashboard reads from `agent_skills/observability/traces/`. To persist traces, write them there from your hooks or directly from the tracer.

---

## Saving traces to disk

In `session-end.js` hook or at the end of `orchestrator.run()`:

```js
const fs   = require('fs');
const path = require('path');

function saveTrace(events, traceId) {
  const dir  = path.join(__dirname, '../../agent_skills/observability/traces');
  const file = path.join(dir, `${traceId}.jsonl`);
  const ndjson = events.map(e => JSON.stringify(e)).join('\n');
  fs.writeFileSync(file, ndjson, 'utf8');
}
```

---

## Hooks that fire automatically

Hooks in `.claude/hooks/` emit observability events at key lifecycle points:

| Hook file | Fires when |
|-----------|-----------|
| `session-start.js` | Claude Code session begins |
| `pre-tool-validate.js` | Before any tool call |
| `post-tool-log.js` | After any tool call completes |
| `session-end.js` | Session ends normally |
| `on-stop.js` | Session is interrupted |

See [hooks-and-skills.md](hooks-and-skills.md) for the full hook reference.

---

## Extending observability

**Add metrics to an existing event:**

```js
tracer._log({
  event: 'cache.hit',
  traceId,
  key: 'user_prefs',
  tier: 'mid',
  ts: Date.now()
});
```

**Forward to an external system (Datadog, Honeycomb, etc.):**

```js
class RemoteTracer extends Tracer {
  _log(obj) {
    super._log(obj);
    fetch(process.env.OTEL_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(obj)
    }).catch(() => {}); // fire-and-forget
  }
}
```
