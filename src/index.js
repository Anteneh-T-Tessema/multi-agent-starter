/**
 * Multi-Agent System — Entry Point
 * 
 * Architecture:
 *   User → Guard → Orchestrator → [RAG | Tool | Memory agents] → Guard → Response
 */
const { Orchestrator } = require('./orchestration');
const { MemoryManager } = require('./memory');
const { Tracer } = require('./observability');
const { guardInput, guardOutput } = require('./guardrails');

async function main() {
  const tracer = new Tracer();
  const memory = new MemoryManager({ vectorStore: null }); // configure MCP vector store

  // Agent registry — wire up your agents here
  const agents = new Map([
    ['guard-agent', { guardInput, guardOutput }],
    // ['rag-agent',   require('./agents/rag-agent')],
    // ['tool-agent',  require('./agents/tool-agent')],
    // ['memory-agent', require('./agents/memory-agent')],
  ]);

  const orchestrator = new Orchestrator({ agents, memory, tracer });

  // Example invocation
  const result = await orchestrator.run({
    userId: 'user-123',
    query: 'Hello, multi-agent system!'
  });

  console.log('Result:', result);
}

main().catch(console.error);
