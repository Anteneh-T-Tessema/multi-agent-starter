/**
 * Orchestration Layer
 * Task Decomposition → Agent Routing → State Machine → Error Recovery
 */
const STATE = {
  IDLE: 'IDLE', GUARD_CHECK: 'GUARD_CHECK', DECOMPOSED: 'DECOMPOSED',
  ROUTING: 'ROUTING', EXECUTING: 'EXECUTING', DONE: 'DONE', ERROR: 'ERROR'
};

class Orchestrator {
  constructor({ agents, memory, tracer }) {
    this.agents = agents; // Map<name, AgentClient>
    this.memory = memory;
    this.tracer = tracer;
    this.state = STATE.IDLE;
  }

  async run(userRequest) {
    const traceId = crypto.randomUUID();
    try {
      this.state = STATE.GUARD_CHECK;
      const safe = await this.agents.get('guard-agent').guardInput(userRequest);
      this.state = STATE.DECOMPOSED;
      const plan = await this.decompose(safe);
      this.state = STATE.EXECUTING;
      const results = await this.executePlan(plan, traceId);
      const response = await this.agents.get('guard-agent').guardOutput(results);
      this.state = STATE.DONE;
      return response;
    } catch (err) {
      this.state = STATE.ERROR;
      throw err; // TODO: retry with exponential backoff
    }
  }

  async decompose(request) {
    // TODO: use LLM to produce structured task list
    return { tasks: [], raw: request };
  }

  async executePlan(plan, traceId) {
    // TODO: run tasks in dependency order, parallel where possible
    return { results: [], traceId };
  }
}

module.exports = { Orchestrator, STATE };
