const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const templatePath = path.join(__dirname, "..", "..", "templates", "base.hbs");

let compiled;

function ensureCompiled() {
  if (compiled) return compiled;

  const source = fs.readFileSync(templatePath, "utf8");

  // Minimal helpers
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  Handlebars.registerHelper("ifEq", function (a, b, opts) {
    return a === b ? opts.fn(this) : opts.inverse(this);
  });

  compiled = Handlebars.compile(source, { noEscape: true });
  return compiled;
}

async function renderProposalHtml(model) {
  const tpl = ensureCompiled();
  return tpl(model);
}

module.exports = { renderProposalHtml };
