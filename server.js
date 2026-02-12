const path = require("path");
const express = require("express");

const proposalsRouter = require("./src/routes/proposals");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// API
app.use("/api", proposalsRouter);

// Home -> builder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "builder.html"));
});

app.listen(PORT, () => {
  console.log(`Proposal Builder running on http://localhost:${PORT}`);
});
