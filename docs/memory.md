# Memory System

![Memory Tiers](images/memory-tiers.svg)

The memory system has three tiers. Each tier is optimised for a different time horizon and access pattern. All three are exposed through a single `MemoryManager` interface.

**Implementation:** [src/memory/index.js](../src/memory/index.js)

---

## Tiers at a glance

| | Short-Term | Mid-Term | Long-Term |
|---|---|---|---|
| **Scope** | Single request | User session | Cross-session |
| **TTL** | Request lifetime | Session duration | Persistent |
| **Backend** | `Map` (in-memory) | Plain object | Vector DB (MCP) |
| **Latency** | ~0ms | ~0ms | 10–50ms |
| **Tier key** | `'short'` | `'mid'` | `'long'` |

---

## API

```js
const { MemoryManager } = require('./memory');
const memory = new MemoryManager({ vectorStore: myVectorClient });

// Write
await memory.write('last_query', 'What is RAG?', 'short');
await memory.write('user_prefs', { lang: 'en' }, 'mid');
await memory.write('doc:42', embeddingPayload, 'long');

// Read
const lastQuery = await memory.read('last_query', 'short'); // instant
const prefs     = await memory.read('user_prefs',  'mid');
const docs      = await memory.read('semantic query', 'long'); // vector search

// Promote short → mid (call at end of request)
await memory.consolidate();
```

---

## Short-term (Working Memory)

Backed by a JavaScript `Map`. Lives for the duration of a single request. Used to pass context between layers within one `orchestrator.run()` call — for example, the validated user intent, intermediate retrieval results, or the current task list.

Clears automatically when the request ends (or the process exits).

**When to write here:** temporary state, current tool outputs, in-flight context.

---

## Mid-term (Session Memory)

A plain object (`this.midTerm = {}`). Survives across multiple requests in the same process lifetime. Used to track per-session state: user preferences, conversation history summary, authenticated identity.

**When to write here:** anything that should persist across turns in a conversation but doesn't need to survive a restart.

---

## Long-term (Vector Store)

Backed by a vector database connected via MCP (configure in [`.mcp.json`](../.mcp.json)). Read operations perform semantic similarity search; write operations upsert an embedding.

**Configure the vector store:**

```json
// .mcp.json
{
  "mcpServers": {
    "qdrant": {
      "command": "npx",
      "args": ["-y", "@qdrant/mcp-server"],
      "env": { "QDRANT_URL": "http://localhost:6333" }
    }
  }
}
```

Then pass the client into `MemoryManager`:

```js
const memory = new MemoryManager({ vectorStore: qdrantClient });
```

**When to write here:** user facts, document embeddings, episodic memories, skill knowledge.

---

## Memory consolidation

Call `memory.consolidate()` at the end of each request to promote important short-term items to mid-term, and important mid-term items to long-term. The stub is in place — implement the promotion logic:

```js
async consolidate() {
  // Example: flush working context to session store
  for (const [key, val] of this.shortTerm) {
    if (shouldPromote(key, val)) {
      this.midTerm[key] = val;
    }
  }
  this.shortTerm.clear();
}
```

---

## Storage directories

Episodic and semantic memory written to disk goes here:

```
agent_skills/memory/
├── working/      # scratch files for in-progress tasks
├── semantic/     # vector embeddings (if persisted locally)
├── episodic/     # decision logs, past interactions
└── procedural/   # skill knowledge, how-to fragments
```

These directories are created by the scaffold and are git-tracked via `.gitkeep` files.
