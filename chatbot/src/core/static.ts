export async function serveStatic(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response("<h1>CF AI Chatbot</h1>", {
      headers: { "content-type": "text/html" },
    });
  }

  return new Response("Not found", { status: 404 });
}
