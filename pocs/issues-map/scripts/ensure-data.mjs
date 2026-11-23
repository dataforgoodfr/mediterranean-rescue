// Lancé avant `pnpm dev` et `pnpm build`. L'instantané GitHub et les vignettes Penpot vivent dans
// data/issues-map/ à la racine du dépôt, ignoré par Git : sur un clone neuf, ils n'existent pas
// encore. On les fabrique s'il le faut, ou on dit clairement quoi faire.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import maquettes from "../maquettes.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const data = join(here, "..", "..", "..", "data", "issues-map");
const run = (script) => execFileSync(process.execPath, [join(here, script)], { stdio: "inherit" });

if (!existsSync(join(data, "snapshot.json"))) {
  let ghReady = true;
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
  } catch {
    ghReady = false;
  }
  if (!ghReady && !process.env.GH_TOKEN) {
    console.error("\nPas d'instantané : connecte gh (gh auth login) puis lance pnpm snapshot.\n");
    process.exit(1);
  }
  console.log("Pas encore d'instantané : je lis GitHub (pnpm snapshot)…");
  run("snapshot.mjs");
}

// Les vignettes Penpot sont publiques : on tente de les télécharger, mais leur absence ne bloque
// rien. L'atlas affiche alors la planche vide, avec la commande pour la récupérer.
const missing = maquettes.boards.filter((b) => b.asset && !existsSync(join(data, "boards", `${b.id}.png`)));
if (missing.length) {
  console.log(`Vignettes Penpot manquantes (${missing.length}) : je les télécharge (pnpm boards)…`);
  try {
    run("boards.mjs");
  } catch {
    console.warn("Vignettes Penpot indisponibles : l'atlas démarre sans elles. Réessaie plus tard avec pnpm boards.");
  }
}
