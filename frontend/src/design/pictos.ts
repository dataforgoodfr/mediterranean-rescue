// Tous les pictos de SOS MEDITERRANEE (assets/pictos), par nom de fichier sans .svg.
// `no-inline` : chaque picto reste un fichier à part, chargé seulement s'il est affiché,
// au lieu d'alourdir le JavaScript. https://vite.dev/guide/features#glob-import
const urls = import.meta.glob<string>('../assets/pictos/*.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

export const pictos: Record<string, string> = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.svg'.length), url]),
)
