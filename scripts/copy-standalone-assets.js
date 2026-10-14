const fs = require("node:fs");

fs.mkdirSync(".next/standalone/.next", { recursive: true });
fs.cpSync(".next/static", ".next/standalone/.next/static", {
  recursive: true,
});
fs.cpSync("public", ".next/standalone/public", { recursive: true });
