import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Un seul fichier HTML autonome : la page publiée ne peut rien charger d'autre.
// `fs.allow` : en dev, Vite lit l'instantané et les vignettes dans data/ à la racine du dépôt.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: { fs: { allow: ["../.."] } },
});
