import { useEffect, type ReactNode } from 'react'
import { ContexteLangue } from './contexte.ts'
import { direction, type Langue } from './traduire.ts'

// Donne la langue à toute l'app, et la reporte sur <html lang dir> pour les lecteurs d'écran
// et le sens de lecture.
export function FournisseurLangue({ langue, children }: { langue: Langue; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = langue
    document.documentElement.dir = direction(langue)
  }, [langue])

  return <ContexteLangue value={langue}>{children}</ContexteLangue>
}
