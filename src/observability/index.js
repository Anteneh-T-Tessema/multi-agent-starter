/**
 * Observability — Distributed Tracing | Token Metrics | Decision Logs | Alerting
 */
class Tracer {
  _log(obj) { console.log(JSON.stringify({ ...obj, ts: Date.now() })); }
  startSpan(traceId, name) { this._log({ event: 'span.start', traceId, name }); }
  endSpan(traceId)          { this._log({ event: 'span.end', traceId }); }
  logDecision(traceId, decision, rationale) { this._log({ event: 'decision', traceId, decision, rationale }); }
  recordTokens(traceId, inp, out) { this._log({ event: 'tokens', traceId, inputTokens: inp, outputTokens: out }); }
}
module.exports = { Tracer };
