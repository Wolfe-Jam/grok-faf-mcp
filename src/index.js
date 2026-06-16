export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/sse" || pathname === "/mcp" || pathname.startsWith("/mcp/")) {
      return Response.redirect("https://mcpaas.live/grok/mcp/v1", 308);
    }
    if (pathname === "/elite" || pathname.startsWith("/elite/")) {
      return Response.redirect("https://builder.faf.one" + pathname.slice("/elite".length) || "/", 308);
    }
    return env.ASSETS.fetch(request); // everything else → static landing
  }
};
