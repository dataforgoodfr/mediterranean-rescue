// Lire ce qui vient de l'extérieur (le réseau, un fichier) sans lui faire confiance : la valeur
// arrive en `unknown`, et chaque champ se vérifie avant d'être utilisé. Jamais de `as`.

export function parseJson(text: string): unknown {
  const value: unknown = JSON.parse(text)
  return value
}

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}
