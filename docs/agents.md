# Agents Reference

![Agent Topology](images/agent-topology.svg)

Agents are defined as Markdown files with YAML frontmatter. The Claude Agent SDK reads the frontmatter to know which model to use, which tools to grant, and how to identify the agent.

```
.claude/agents/
├── orchestrator.md
├── guard-agent.md
├── rag-agent.md
├── memory-agent.md
└── tool-agent.md
```

---

## Agent frontmatter schema

```yaml
---
name: my-agent            # unique ID — used in routing table
description: …            # one-line trigger description
model: claude-sonnet-4-20250514
tools: [Read, Write, Bash]
---
```

The `description` field is what the orchestrator matches against when routing tasks. Keep it specific.

---

## Built-in agents

### Orchestrator

**File:** [.claude/agents/orchestrator.md](../.claude/agents/orchestrator.md)

The master coordinator. It receives a safe, validated request from the guardrails layer, breaks it into a task plan, and routes each task to the appropriate specialist agent.

**State machine:**

```
IDLE → GUARD_CHECK → DECOMPOSED → ROUTING → EXECUTING → DONE
                                                       ↘ ERROR
```

**Routing table:**

| Task type | Routed to |
|-----------|-----------|
| Validation / safety | guard-agent |
| Information retrieval | rag-agent |
| Tool execution | tool-agent |
| Context read/write | memory-agent |

**Output format:**

```json
{
  "trace_id": "uuid",
  "tasks": [
    { "id": "t1", "agent": "rag-agent", "payload": { "query": "…" } }
  ],
  "state": "DECOMPOSED"
}
```

---

### Guard Agent

**File:** [.claude/agents/guard-agent.md](../.claude/agents/guard-agent.md)  
**Implementation:** [src/guardrails/index.js](../src/guardrails/index.js)

Runs at both entry (`guardInput`) and exit (`guardOutput`). Responsible for:

- JSON schema validation
- PII detection and redaction (emails, phone numbers, SSNs)
- Per-user rate limiting
- Output sanitisation (strip trace IDs, internal stack traces)

---

### RAG Agent

**File:** [.claude/agents/rag-agent.md](../.claude/agents/rag-agent.md)

Implements Agentic RAG with iterative query rewriting. It loops until the retrieved context is judged relevant, or a max-retry limit is hit.

**Loop:**

```
Rewrite Query
      ↓
Select Source (Vector DB → APIs → Internet)
      ↓
Retrieve
      ↓
Relevant? ──Yes──→ Generate Answer → Done
    ↓ No
Retry (max 3×)
```

**Source priority:**

1. Vector DB (lowest latency, highest relevance for domain knowledge)
2. MCP-connected APIs (real-time data)
3. Internet search (Brave, fallback)

---

### Memory Agent

**File:** [.claude/agents/memory-agent.md](../.claude/agents/memory-agent.md)  
**Implementation:** [src/memory/index.js](../src/memory/index.js)

Reads and writes all three memory tiers on behalf of other agents. Handles promotion (short → mid → long) and retrieval routing.

See [memory.md](memory.md) for the full tier reference.

---

### Tool Agent

**File:** `.claude/agents/tool-agent.md`  
**Implementation:** [src/tools/index.js](../src/tools/index.js)

Executes tools declared in `agent_skills/tools/registry.yaml`. Routes to either a local JS implementation or an MCP server.

---

## Communication protocol

All inter-agent messages use this envelope:

```json
{
  "from": "orchestrator",
  "to": "rag-agent",
  "task": "retrieve_context",
  "payload": {
    "query": "What is agentic RAG?",
    "top_k": 5
  },
  "trace_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

The `trace_id` is generated once by the orchestrator and propagated to every downstream call. It is how you correlate spans in the observability dashboard.

---

## Adding a new agent

1. **Create the agent definition:**

```bash
cp .claude/agents/rag-agent.md .claude/agents/my-agent.md
```

Edit the frontmatter:

```yaml
---
name: my-agent
description: Summarises documents when a summary is requested.
model: claude-sonnet-4-20250514
tools: [Read]
---
```

2. **Implement it** in `src/agents/my-agent.js`:

```js
async function run({ payload, traceId }) {
  // your logic here
  return { summary: '…', traceId };
}
module.exports = { run };
```

3. **Register it** in [src/index.js](../src/index.js):

```js
const agents = new Map([
  ['guard-agent', { guardInput, guardOutput }],
  ['my-agent',    require('./agents/my-agent')],
]);
```

4. **Add routing** in the orchestrator's routing table.

5. **Write evals** in `agent_skills/evals/per_skill/my-agent/`.
