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

/** Grok's FAF passport + discovery entries, served from docs/cards/. */
export const SERVED_CARDS = {
  "/.well-known/fafa": { asset: "/cards/agent.fafa", type: "application/vnd.fafa+yaml; charset=utf-8" },
  "/.well-known/ai-catalog.json": { asset: "/cards/ai-catalog.json", type: "application/ai-catalog+json; charset=utf-8" },
  "/.well-known/ard.json": { asset: "/cards/ard.json", type: "application/json; charset=utf-8" },
};

/** The live MCP Server Card is the hosted one (it lists the hosted remote). */
export const SERVER_CARD_URL = "https://mcpaas.live/grok/mcp/v1/server-card";

export function isServerCardPath(pathname) {
  return pathname === "/mcp/server-card" || pathname === "/.well-known/mcp/server-card.json";
}

export async function serveCard(card, request, env) {
  const res = await env.ASSETS.fetch(new Request(new URL(card.asset, request.url)));
  if (!res.ok) return res;
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": card.type,
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (isAgentCardProbe(pathname)) {
      return agentCardAbsence();
    }
    if (isServerCardPath(pathname)) {
      return Response.redirect(SERVER_CARD_URL, 308);
    }
    const card = SERVED_CARDS[pathname];
    if (card) {
      return serveCard(card, request, env);
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
