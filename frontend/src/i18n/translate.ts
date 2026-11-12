import { ar } from './ar.ts'
import { en } from './en.ts'
import { fr } from './fr.ts'
import { keys, type MessageKey, type Translations } from './keys.ts'

// Les langues de l'app. Une langue de plus (italien, allemand…) : un fichier comme fr.ts,
// une entrée dans `translations` et une dans `LANGUAGES`. Mode d'emploi : TECHNICAL.md
// (« Les langues »).
const translations = { en, fr, ar } satisfies Record<string, Translations>

export type Language = keyof typeof translations

// L'ordre compte : la première langue est celle par défaut, et celle qui remplace une
// traduction absente.
export const LANGUAGES: readonly Language[] = ['en', 'fr', 'ar']

// Les langues qui s'écrivent de droite à gauche.
// https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Global_attributes/dir
const RIGHT_TO_LEFT: readonly Language[] = ['ar']

// La langue de l'app d'après celles du navigateur (`navigator.languages`) : « fr-FR » donne fr.
export function detectLanguage(preferred: readonly string[]): Language {
  for (const candidate of preferred) {
    const match = LANGUAGES.find((language) => candidate.toLowerCase().startsWith(language))
    if (match) return match
  }
  return 'en'
}

export function direction(language: Language): 'ltr' | 'rtl' {
  return RIGHT_TO_LEFT.includes(language) ? 'rtl' : 'ltr'
}

// Le texte d'une clé dans une langue. Absent : l'anglais, puis le français, puis la clé
// elle-même entre crochets, pour qu'un oubli se voie à l'écran au lieu de casser l'app.
// `values` remplace les `{name}` du texte.
export function translate(
  language: Language,
  key: MessageKey,
  values: Record<string, string> = {},
): string {
  const text = translations[language][key] ?? en[key] ?? fr[key] ?? `[${key}]`
  return text.replace(/\{(\w+)\}/g, (raw, name: string) => values[name] ?? raw)
}

function isKey(text: string): text is MessageKey {
  return Object.hasOwn(keys, text)
}

// Les clés qu'une langue n'a pas encore : `pnpm i18n:missing` les liste, sans rien bloquer.
export function missingKeys(language: Language): MessageKey[] {
  return Object.keys(keys)
    .filter(isKey)
    .filter((key) => translations[language][key] === undefined)
}
