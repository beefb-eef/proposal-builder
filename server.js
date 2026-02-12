const path = require("path");
const fs = require("fs");
const express = require("express");

const proposalsRouter = require("./src/routes/proposals");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

// Parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Static assets (css/js/etc)
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      // Explicit MIME types for common assets (extra safety)
      if (filePath.endsWith(".css")) res.setHeader("Content-Type", "text/css; charset=utf-8");
      if (filePath.endsWith(".js")) res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      if (filePath.endsWith(".html")) res.setHeader("Content-Type", "text/html; charset=utf-8");
    }
  })
);

// API
app.use("/api", proposalsRouter);

// Health check (nice for Render)
app.get("/health", (req, res) => res.status(200).send("ok"));

// Serve builder.html with a forced HTML content-type (no MIME guessing)
function sendBuilder(req, res) {
  const filePath = path.join(__dirname, "public", "builder.html");
  const html = fs.readFileSync(filePath, "utf8");
  res.status(200);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}

// Root
app.get("/", sendBuilder);

// Catch-all (if someone hits /whatever)
app.get("*", (req, res, next) => {
  // Let static files + API 404 normally
  if (req.path.startsWith("/api")) return next();
  // If it's a file request, let it 404 (or be served by static)
  if (path.extname(req.path)) return next();
  return sendBuilder(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 Proposal Builder running on port ${PORT}`);
});
