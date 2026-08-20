/** A2A well-known probes. 404, not a card. No URLs — not discovery. */
export const NOT_AN_A2A_AGENT = `This origin is not an A2A agent.

grok-faf-mcp is an MCP door for FAF on Grok.
There is no Agent Card here.
`;

export function isAgentCardProbe(pathname) {
  return (
    pathname === "/.well-known/agent-card.json" ||
    pathname === "/.well-known/agent.json"
  );
}

export function agentCardAbsence() {
  return new Response(NOT_AN_A2A_AGENT, {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (isAgentCardProbe(pathname)) {
      return agentCardAbsence();
    }
    if (pathname === "/sse" || pathname === "/mcp" || pathname.startsWith("/mcp/")) {
      return Response.redirect("https://mcpaas.live/grok/mcp/v1", 308);
    }
    if (pathname === "/elite" || pathname.startsWith("/elite/")) {
      return Response.redirect("https://builder.faf.one" + pathname.slice("/elite".length) || "/", 308);
    }
    return env.ASSETS.fetch(request); // everything else → static landing
  }
};
