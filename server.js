const path = require("path");
const express = require("express");

const proposalsRouter = require("./src/routes/proposals");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

// Body parsing
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 ✅ CRITICAL FIX:
 Force correct MIME type for HTML files so the browser renders them
 instead of printing the code.
*/
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }
  }
}));

// API routes
app.use("/api", proposalsRouter);

/**
 Explicit root route
 (acts as a second safety net)
*/
app.get("/", (req, res) => {
  res
    .status(200)
    .type("html")
    .sendFile(path.join(__dirname, "public", "builder.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Proposal Builder running on port ${PORT}`);
});
