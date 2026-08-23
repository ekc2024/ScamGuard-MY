import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleEnrich } from "./lib/enrich-handler.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT ?? 3100);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/** Static file server for local development; production is served straight off a static host. */
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (pathname === "/api/enrich") {
    if (request.method !== "POST") {
      response.writeHead(405, { "content-type": "application/json" }).end(JSON.stringify({ error: "Use POST." }));
      return;
    }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const { status, body } = await handleEnrich(Buffer.concat(chunks).toString("utf8"));
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify(body));
    return;
  }

  const relative = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(ROOT, relative);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`scam-triage front-end on http://localhost:${PORT}`);
});
