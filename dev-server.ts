import {watch} from "fs";

// SSE clients
const clients = new Set<ReadableStreamDefaultController>();

function notify_reload() {
  const msg = `data: reload\n\n`;
  for (const ctrl of clients) {
    try { ctrl.enqueue(msg); } catch { /* client disconnected */ }
  }
}

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/main.ts"],
    outdir: "./dist",
    target: "browser",
  });
  if (result.success) {
    notify_reload();
    console.log("Built ok", result.outputs.length > 0 ? `(${result.outputs[0].size} bytes)` : "");
  } else {
    for (const err of result.logs)
      console.error(err);
  }
}

// Initial build
console.log("Building...");
await build();

// Watch source files, rebuild on change
watch("./src", { recursive: true }, async (_event, filename) => {
  if (filename && filename.endsWith(".ts")) {
    console.log(`${filename} changed, rebuilding...`);
    await build();
  }
});
console.log("Watching src/ for changes...");

// Dev server
Bun.serve({
  port: 8080,
  async fetch(req) {
    const url = new URL(req.url);

    // SSE endpoint — browser connects here for reload signals
    if (url.pathname === "/__reload") {
      return new Response(
        new ReadableStream({
          start(controller) {
            clients.add(controller);
            req.signal?.addEventListener("abort", () => {
              clients.delete(controller);
            });
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    // Serve static files
    let file_path = url.pathname;
    if (file_path === "/") file_path = "/index.html";
    if (file_path === "/favicon.ico") return new Response(null, { status: 204 });

    const file = Bun.file("." + file_path);
    const exists = await file.exists();
    if (!exists) return new Response("Not found", { status: 404 });

    // Inject live-reload script into HTML
    if (file_path.endsWith(".html")) {
      const html = await file.text();
      const injected = html.replace(
        "</body>",
        "<script>new EventSource('/__reload').onmessage=()=>location.reload()</script></body>"
      );
      return new Response(injected, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(file);
  },
});

console.log("Dev server: http://localhost:8080");
