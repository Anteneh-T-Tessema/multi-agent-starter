# Hooks & Skills

## Hooks

Hooks are Node.js scripts in `.claude/hooks/` that the Claude Code runtime executes at specific lifecycle events. They run deterministically — they are not LLM-driven.

```
.claude/hooks/
├── session-start.js      # fires once when a session begins
├── pre-tool-validate.js  # fires before every tool call
├── post-tool-log.js      # fires after every tool call
├── session-end.js        # fires when the session ends normally
└── on-stop.js            # fires if the session is interrupted
```

### Hook input

The runtime passes event data via `stdin` as JSON. Each hook reads it like this:

```js
// .claude/hooks/post-tool-log.js
process.stdin.resume();
let buf = '';
process.stdin.on('data', d => (buf += d));
process.stdin.on('end', () => {
  const event = JSON.parse(buf || '{}');
  // { tool: 'Bash', input: {…}, output: {…}, durationMs: 42 }
  console.error(`[hook] ${event.tool} completed in ${event.durationMs}ms`);
});
```

### Hook exit codes

| Exit code | Effect |
|-----------|--------|
| `0` | Normal — execution continues |
| `2` | Block — the tool call is cancelled and Claude is shown the hook's stderr |
| other | Warning logged, execution continues |

### Blocking a tool call

```js
// .claude/hooks/pre-tool-validate.js
process.stdin.resume();
let buf = '';
process.stdin.on('data', d => (buf += d));
process.stdin.on('end', () => {
  const { tool, input } = JSON.parse(buf || '{}');
  if (tool === 'Bash' && /rm\s+-rf/.test(input.command)) {
    console.error('[guard] rm -rf blocked by pre-tool hook');
    process.exit(2);
  }
});
```

### Wiring hooks in settings

Hooks are declared in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-tool-validate.js" }] }
    ],
    "PostToolUse": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "node .claude/hooks/post-tool-log.js" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/on-stop.js" }] }
    ]
  }
}
```

---

## Skills

Skills are reusable expertise modules that Claude Code can invoke when context matches. They live in `.claude/skills/`.

```
.claude/skills/
└── example-skill/
    ├── SKILL.md          # description, trigger conditions, I/O spec
    ├── examples.jsonl    # golden input/output pairs
    └── allowlist.yaml    # which agents may invoke this skill
```

### SKILL.md format

```markdown
---
name: example-skill
trigger: when the user asks to do X
---

# Example Skill

## Input
{ "query": string }

## Output
{ "result": string }

## Steps
1. Parse the query
2. …
```

### examples.jsonl format

Each line is one golden example:

```json
{"input": {"query": "hello"}, "output": {"result": "world"}}
{"input": {"query": "summarise this doc"}, "output": {"result": "…"}}
```

These are used by `npm run evals:skill` to verify skill behaviour hasn't regressed.

### allowlist.yaml

Controls which agents may invoke the skill:

```yaml
allow:
  - orchestrator
  - rag-agent
deny:
  - '*'   # deny all others
```

### Adding a new skill

```bash
# 1. Copy the example skeleton
cp -r .claude/skills/example-skill .claude/skills/my-skill

# 2. Edit SKILL.md — describe the trigger and I/O
# 3. Add golden examples to examples.jsonl
# 4. Set agent access in allowlist.yaml
# 5. Log the addition in CHANGELOG.md
```

Skills are auto-invoked by Claude Code when the session context matches the `trigger` field in `SKILL.md`. No code registration is required.
