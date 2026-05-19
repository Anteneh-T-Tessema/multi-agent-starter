# Getting Started

## Prerequisites

| Requirement | Minimum version |
|-------------|----------------|
| Node.js | 18+ |
| npm | 9+ |
| Anthropic API key | — |

---

## 1. Clone and install

```bash
git clone https://github.com/your-org/multi-agent-starter my-project
cd my-project
npm install
```

---

## 2. Configure your environment

Copy the local config template and fill in your keys:

```bash
cp CLAUDE.local.md.example CLAUDE.local.md
```

Then edit `CLAUDE.local.md`:

```
ANTHROPIC_API_KEY=sk-ant-…
VECTOR_STORE_URL=http://localhost:6333   # optional
MCP_SERVER_URL=http://localhost:3100     # optional
```

> **Never commit `CLAUDE.local.md`** — it is listed in `.gitignore`.

---

## 3. Run the system

```bash
# Full system (guard → orchestrate → agents → respond)
npm start

# Orchestrator only (skips guardrails wrapper)
npm run orchestrate

# Observability dashboard (reads saved traces)
npm run observe

# Run all evals
npm run evals
```

---

## 4. Wire up a real LLM call

Open [src/orchestration/index.js](../src/orchestration/index.js) and replace the stub `decompose()`:

```js
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

async decompose(request) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: `Decompose this task: ${request.query}` }]
  });
  return JSON.parse(msg.content[0].text);
}
```

---

## 5. Add your first agent

Create `.claude/agents/my-agent.md`:

```markdown
---
name: my-agent
description: Does X when Y is requested.
model: claude-sonnet-4-20250514
tools: [Read, Bash]
---

# My Agent

Instruction prompt goes here.
```

Register it in `src/index.js`:

```js
const agents = new Map([
  ['guard-agent',  { guardInput, guardOutput }],
  ['my-agent',     require('./agents/my-agent')],
]);
```

See [agents.md](agents.md) for the complete agent reference.

---

## 6. Connect an MCP tool

Edit [.mcp.json](../.mcp.json) to add a server:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "your-key" }
    }
  }
}
```

Then declare the tool in [agent_skills/tools/registry.yaml](../agent_skills/tools/registry.yaml):

```yaml
tools:
  - name: web_search
    description: Search the web using Brave
    type: mcp
    server: brave-search
```

---

## 7. Run evals for your skill

Add a test case to `agent_skills/evals/per_skill/`:

```json
{
  "name": "my-agent-basic",
  "input": { "query": "hello" },
  "expected": { "result": "world" },
  "actual": { "result": "world" }
}
```

```bash
npm run evals:skill
```

---

## Project layout at a glance

```
my-project/
├── src/
│   ├── index.js              # Entry point — wires all layers
│   ├── guardrails/           # Layer 1: I/O safety
│   ├── orchestration/        # Layer 2: task routing
│   ├── tools/                # Layer 3: tool registry
│   ├── memory/               # Layer 4: 3-tier memory
│   └── observability/        # Layer 5: traces & metrics
├── .claude/
│   ├── agents/               # Subagent definitions (*.md)
│   ├── skills/               # Reusable skill modules
│   ├── hooks/                # Lifecycle hooks (JS)
│   └── settings.json         # Permissions, env vars
├── agent_skills/
│   ├── tools/registry.yaml   # Tool declarations
│   ├── evals/                # Evaluation suites
│   └── observability/        # Saved traces & events
├── CLAUDE.md                 # Project brain (auto-loaded)
└── .mcp.json                 # MCP server connections
```

For a deeper dive, see [architecture.md](architecture.md).
