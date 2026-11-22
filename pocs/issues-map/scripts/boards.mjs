// Télécharge les vignettes des planches listées dans maquettes.json vers data/issues-map/boards/
// à la racine du dépôt (ignoré par Git). Penpot sert une vignette par son identifiant d'asset
// sans connexion ; trouver cet identifiant demande une session : voir scripts/penpot-assets.js.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import maquettes from "../maquettes.json" with { type: "json" };

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "data", "issues-map", "boards");
mkdirSync(out, { recursive: true });
for (const b of maquettes.boards) {
  if (!b.asset) continue; // un schéma dessiné dans le code, pas une planche Penpot
  const url = `${maquettes.penpot.base}/assets/by-id/${b.asset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${b.id} : HTTP ${res.status} sur ${url}. Identifiant périmé : relancer scripts/penpot-assets.js.`);
  writeFileSync(join(out, `${b.id}.png`), Buffer.from(await res.arrayBuffer()));
  console.log(`${b.id}.png <- ${b.penpotName}`);
}
