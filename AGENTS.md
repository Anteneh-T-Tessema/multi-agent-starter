# Agent Operating Manual

This document describes every agent in this system, their responsibilities, and how they interact.

## Agent Roster

| Agent | File | Role |
|-------|------|------|
| Orchestrator | `.claude/agents/orchestrator.md` | Decomposes tasks, routes to specialists |
| RAG Agent | `.claude/agents/rag-agent.md` | Agentic retrieval-augmented generation |
| Tool Agent | `.claude/agents/tool-agent.md` | Executes tool calls, manages MCP |
| Memory Agent | `.claude/agents/memory-agent.md` | Manages context across memory tiers |
| Guard Agent | `.claude/agents/guard-agent.md` | Input validation, PII filtering, output sanitization |

## Communication Protocol

Agents communicate via structured JSON messages:
```json
{
  "from": "orchestrator",
  "to": "rag-agent",
  "task": "retrieve_context",
  "payload": { "query": "...", "top_k": 5 },
  "trace_id": "uuid-here"
}
```

## State Machine

```
IDLE → QUERY_RECEIVED → GUARD_CHECK → DECOMPOSED → ROUTING
     → TOOL_CALL → MEMORY_READ → LLM_CALL → MEMORY_WRITE
     → RELEVANCE_CHECK → RESPONSE_READY → GUARD_OUTPUT → DONE
```

## Multi-Agent Coordination (Experimental)

Multiple Claude sessions as peers — not just delegation, but collaboration.
- Shared task list
- Direct messaging via worktrees
- 1M-token context each
- Structured execution memory
