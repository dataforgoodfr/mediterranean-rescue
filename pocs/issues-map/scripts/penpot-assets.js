// À coller dans la console du navigateur sur https://penpot.services.dataforgood.fr, connecté.
// Lecture seule. Affiche, pour chaque planche du fichier Wireframes, son nom, son identifiant et
// l'identifiant d'asset de sa vignette actuelle. Recopier ces identifiants dans maquettes.json,
// puis lancer `pnpm boards && pnpm build`.
(async () => {
  const fileId = "e499b291-4f64-81a8-8008-f039eb67d80e";
  const get = (cmd, q) =>
    fetch(`/api/rpc/command/${cmd}?${q}`, { headers: { accept: "application/json" }, credentials: "include" }).then((r) => r.json());
  const file = await get("get-file", `id=${fileId}`);
  const thumbs = await get("get-file-object-thumbnails", `file-id=${fileId}`);
  const ROOT = "00000000-0000-0000-0000-000000000000";
  const rows = [];
  for (const pageId of file.data.pages) {
    const page = file.data.pagesIndex[pageId];
    for (const o of Object.values(page.objects)) {
      if (o.type !== "frame" || o.parentId !== ROOT || o.id === ROOT) continue;
      const key = Object.keys(thumbs).find((k) => k.includes(o.id));
      rows.push({ page: page.name, board: o.name, penpotId: o.id, asset: key ? thumbs[key] : null, w: o.width, h: o.height });
    }
  }
  console.table(rows);
  return rows;
})();
