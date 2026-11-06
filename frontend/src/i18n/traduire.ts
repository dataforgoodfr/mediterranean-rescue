import { ar } from './ar.ts'
import { cles, type Cle, type Traductions } from './cles.ts'
import { en } from './en.ts'
import { fr } from './fr.ts'

export type Langue = 'en' | 'fr' | 'ar'

// L'ordre compte : la première langue est celle par défaut, et celle qui remplace une
// traduction absente.
export const LANGUES: readonly Langue[] = ['en', 'fr', 'ar']

const traductions: Record<Langue, Traductions> = { en, fr, ar }

// La langue de l'app d'après celles du navigateur (`navigator.languages`) : « fr-FR » donne fr.
export function choisirLangue(preferees: readonly string[]): Langue {
  for (const preferee of preferees) {
    const trouvee = LANGUES.find((langue) => preferee.toLowerCase().startsWith(langue))
    if (trouvee) return trouvee
  }
  return 'en'
}

// L'arabe s'écrit de droite à gauche. https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Global_attributes/dir
export function direction(langue: Langue): 'ltr' | 'rtl' {
  return langue === 'ar' ? 'rtl' : 'ltr'
}

// Le texte d'une clé dans une langue. Absent : l'anglais, puis le français, puis la clé
// elle-même entre crochets, pour qu'un oubli se voie à l'écran au lieu de casser l'app.
// `valeurs` remplace les `{nom}` du texte.
export function traduire(langue: Langue, cle: Cle, valeurs: Record<string, string> = {}): string {
  const texte = traductions[langue][cle] ?? en[cle] ?? fr[cle] ?? `[${cle}]`
  return texte.replace(/\{(\w+)\}/g, (brut, nom: string) => valeurs[nom] ?? brut)
}

function estCle(texte: string): texte is Cle {
  return Object.hasOwn(cles, texte)
}

// Les clés qu'une langue n'a pas encore : `pnpm i18n:manquantes` les liste, sans rien bloquer.
export function manquantes(langue: Langue): Cle[] {
  return Object.keys(cles)
    .filter(estCle)
    .filter((cle) => traductions[langue][cle] === undefined)
}
