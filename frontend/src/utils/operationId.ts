// L'identifiant d'une opération dans un lien, comme /operations/42. Un lien invalide se comporte
// comme une opération introuvable : la carte s'ouvre, avec un message clair.
export function parseOperationId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
