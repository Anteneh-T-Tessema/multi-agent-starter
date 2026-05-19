# Architecture

![Architecture Overview](images/architecture-overview.svg)

This system is built around five composable layers. Each layer has a single responsibility and a clean interface to its neighbours.

## Layer 1 — Guardrails & Gateway

**File:** [src/guardrails/index.js](../src/guardrails/index.js)

Every request enters and leaves through the guardrails layer. Nothing reaches the orchestrator that hasn't been validated; nothing reaches the user that hasn't been sanitised.

| Step | What it does |
|------|-------------|
| `guardInput(request)` | Schema validation, PII scrubbing, rate-limit check |
| `guardOutput(response)` | Strip internal trace IDs, redact unsafe content |

**Extending it:**

```js
// src/guardrails/index.js
async function guardInput(request) {
  validateSchema(request);       // throw on bad shape
  filterPII(request);            // redact emails, SSNs …
  await rateLimiter.check(request.userId);
  return request;
}
```

---

## Layer 2 — Orchestration

**File:** [src/orchestration/index.js](../src/orchestration/index.js)

The orchestrator owns the state machine and is the only component that talks to other agents directly.

```
IDLE → GUARD_CHECK → DECOMPOSED → ROUTING → EXECUTING → DONE
                                                       ↘ ERROR
```

**State transitions:**

| From | To | Trigger |
|------|----|---------|
| `IDLE` | `GUARD_CHECK` | `run()` called |
| `GUARD_CHECK` | `DECOMPOSED` | `guardInput` passes |
| `DECOMPOSED` | `EXECUTING` | `decompose()` returns task list |
| `EXECUTING` | `DONE` | all tasks resolved |
| any | `ERROR` | unhandled exception |

**Adding parallel task execution:**

```js
async executePlan(plan, traceId) {
  const results = await Promise.all(
    plan.tasks.map(task => this.runTask(task, traceId))
  );
  return { results, traceId };
}
```

---

## Layer 3 — Tool & MCP Integration

**File:** [src/tools/index.js](../src/tools/index.js)  
**Registry:** [agent_skills/tools/registry.yaml](../agent_skills/tools/registry.yaml)

Tools are declared in `registry.yaml` and routed to either a local implementation or an MCP server.

```yaml
# agent_skills/tools/registry.yaml
tools:
  - name: web_search
    description: Search the web
    type: mcp
    server: brave-search
  - name: read_file
    description: Read a file from disk
    type: local
    impl: src/tools/local/read-file.js
```

Calling a tool from an agent:

```js
const { callTool } = require('../tools');
const result = await callTool('web_search', { query: 'multi-agent systems' });
```

---

## Layer 4 — Memory & Context

**File:** [src/memory/index.js](../src/memory/index.js)

See [memory.md](memory.md) for the full three-tier reference.

![Memory Tiers](images/memory-tiers.svg)

---

## Layer 5 — Observability

**File:** [src/observability/index.js](../src/observability/index.js)  
**Dashboard:** [src/observability/dashboard.js](../src/observability/dashboard.js)

Every span, decision, and token count is emitted as a structured JSON line to stdout and optionally written to `agent_skills/observability/traces/`.

```js
tracer.startSpan(traceId, 'orchestrate');
tracer.logDecision(traceId, 'route:rag-agent', 'query requires retrieval');
tracer.recordTokens(traceId, 512, 128);
tracer.endSpan(traceId);
```

Run the dashboard:

```bash
npm run observe
```

---

## Data Flow

![Request Lifecycle](images/request-lifecycle.svg)

1. **User** sends `{ userId, query }` to `main()`
2. **Guard Input** validates, filters PII, checks rate limit
3. **Orchestrate** decomposes into a task plan
4. **Agents** execute tasks in dependency order (Guard, RAG, Memory, Tool)
5. **Guard Output** sanitises the aggregated result
6. **Response** returned to caller with `traceId`

---

## Agent Topology

![Agent Topology](images/agent-topology.svg)

Agents are defined as Markdown files with YAML frontmatter in `.claude/agents/`. The Claude Agent SDK instantiates each one as an independent context with its own tool access list.

| Agent | File | Responsibility |
|-------|------|---------------|
| Orchestrator | `.claude/agents/orchestrator.md` | Decompose + route |
| Guard | `.claude/agents/guard-agent.md` | I/O safety |
| RAG | `.claude/agents/rag-agent.md` | Context retrieval |
| Memory | `.claude/agents/memory-agent.md` | Tier read/write |
| Tool | `.claude/agents/tool-agent.md` | MCP + local tools |
