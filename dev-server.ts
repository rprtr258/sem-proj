Bun.serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/favicon.ico")
      return new Response();

    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file("." + path);
    return new Response(file);
  },
});

console.log("Dev server: http://localhost:8080");
