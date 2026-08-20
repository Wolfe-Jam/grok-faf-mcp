/**
 * grok.faf.one A2A well-known probe — 404 with a reason, not a card.
 * Body must not be JSON and must not carry discovery URLs.
 */
import { describe, it, expect } from 'bun:test';
import {
  NOT_AN_A2A_AGENT,
  isAgentCardProbe,
  agentCardAbsence,
} from '../src/index.js';

describe('Agent Card absence (not discovery)', () => {
  it('treats A2A well-known paths as probes', () => {
    expect(isAgentCardProbe('/.well-known/agent-card.json')).toBe(true);
    expect(isAgentCardProbe('/.well-known/agent.json')).toBe(true);
    expect(isAgentCardProbe('/')).toBe(false);
    expect(isAgentCardProbe('/.well-known/mcp.json')).toBe(false);
  });

  it('answers 404 text/plain, not an Agent Card', async () => {
    const res = agentCardAbsence();
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/);
    const body = await res.text();
    expect(body).toBe(NOT_AN_A2A_AGENT);
    expect(body).toContain('not an A2A agent');
    expect(body).toContain('no Agent Card');
    expect(body).not.toMatch(/https?:\/\//);
    expect(body.trim().startsWith('{')).toBe(false);
  });
});
