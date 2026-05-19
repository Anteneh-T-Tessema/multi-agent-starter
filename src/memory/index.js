/**
 * Memory & Context — Three Tiers
 * Short-Term (conversation) | Mid-Term (session) | Long-Term (vector store)
 */
class MemoryManager {
  constructor({ vectorStore }) {
    this.shortTerm = new Map();
    this.midTerm = {};
    this.vectorStore = vectorStore;
  }
  async read(key, tier = 'short') {
    if (tier === 'short') return this.shortTerm.get(key);
    if (tier === 'mid') return this.midTerm[key];
    if (tier === 'long') return this.vectorStore.search(key);
  }
  async write(key, value, tier = 'short') {
    if (tier === 'short') this.shortTerm.set(key, value);
    if (tier === 'mid') this.midTerm[key] = value;
    if (tier === 'long') await this.vectorStore.upsert(key, value);
  }
  async consolidate() { /* TODO: short→mid→long promotion */ }
}
module.exports = { MemoryManager };
