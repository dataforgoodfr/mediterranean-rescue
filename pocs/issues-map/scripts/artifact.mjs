// Transforme le fichier unique dist/index.html de Vite en fragment HTML (sans <html>, <head> ni
// <body>) pour une page hébergée qui ajoute son propre squelette : dist/atlas-des-issues.html.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");

const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
const keepHead = head
  .replace(/<meta charset[^>]*>\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "");

// Le <title> reste en tête, avant le script et le style intégrés.
const out = `${keepHead.trim()}\n${body.trim()}\n`;
writeFileSync(join(dist, "atlas-des-issues.html"), out);
console.log(`dist/atlas-des-issues.html: ${(out.length / 1024).toFixed(0)} KB`);
