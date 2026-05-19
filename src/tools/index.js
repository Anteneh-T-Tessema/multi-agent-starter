/**
 * Tool Registry — load and call tools declared in agent_skills/tools/registry.yaml
 */
const YAML = require('js-yaml'); // npm install js-yaml
const fs   = require('fs');
const path = require('path');

function loadRegistry() {
  const file = path.join(__dirname, '../../agent_skills/tools/registry.yaml');
  return YAML.load(fs.readFileSync(file, 'utf8'));
}

async function callTool(name, inputs) {
  const registry = loadRegistry();
  const tool = registry.tools.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  // TODO: route to MCP or local implementation
  return { tool: name, inputs, result: null };
}

module.exports = { loadRegistry, callTool };
