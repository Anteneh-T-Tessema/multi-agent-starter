# Project Brain — Multi-Agent Starter

> Auto-loaded every Claude Code session. Keep this accurate and concise.

## Architecture Overview

This is a **multi-agent system starter** built around the Agentic RAG pattern with 5 core layers:
1. Guardrails & Gateway
2. Orchestration
3. Tool & MCP Integration
4. Memory & Context
5. Observability

## Tech Stack

- **Runtime**: Node.js / Python (pick one per service)
- **LLM**: Anthropic Claude (claude-sonnet-4-20250514 default)
- **Vector Store**: (configure in `.mcp.json`)
- **Orchestration**: Custom state machine in `src/orchestration/`
- **Memory**: Three-tier — short (conversation), mid (session), long (vector store)

## Project Structure

```
my-project/
├── CLAUDE.md              # ← You are here (project brain)
├── CLAUDE.local.md        # Personal overrides (gitignored)
├── .claude/
│   ├── settings.json      # Permissions, hooks, env vars
│   ├── skills/            # Reusable expertise modules
│   └── agents/            # Subagent definitions
├── agent_skills/          # Full AGENT_SKILLS repo layout
├── src/
│   ├── guardrails/        # Input validation, PII filtering, rate limiting
│   ├── orchestration/     # Task decomposition, routing, state machine
│   ├── tools/             # Tool registry + local tools
│   ├── memory/            # Short/mid/long-term memory
│   └── observability/     # Tracing, metrics, decision logs
├── .mcp.json              # External tool connections
├── .claudeignore          # Files Claude should never read
└── plugins/               # Bundled skill + agent packages
```

## Conventions

- **Agents** live in `.claude/agents/` as `.md` files with YAML frontmatter
- **Skills** are auto-invoked when task context matches description in SKILL.md
- **Hooks** fire deterministically — never hallucinate (see `.claude/settings.json`)
- **All tools** are declared in `agent_skills/tools/registry.yaml`
- **Every skill addition** is logged in `CHANGELOG.md`

## Workflow Rules

1. Run `/init` on first session to scaffold missing files
2. Read relevant SKILL.md before executing any skill
3. Log decisions to `agent_skills/memory/episodic/`
4. Emit traces via `agent_skills/observability/traces/`
5. Never read files listed in `.claudeignore`

## Common Commands

```bash
# Start orchestrator
npm run orchestrate

# Run skill evals
npm run evals

# Check observability dashboard
npm run observe
```
