import { useContext } from 'react'
import type { Cle } from './cles.ts'
import { ContexteLangue } from './contexte.ts'
import { traduire } from './traduire.ts'

// Dans un composant : `const t = useTraduction()`, puis `t('accueil.titre')`.
export function useTraduction() {
  const langue = useContext(ContexteLangue)
  return (cle: Cle, valeurs?: Record<string, string>) => traduire(langue, cle, valeurs)
}
