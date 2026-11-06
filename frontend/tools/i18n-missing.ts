// Liste les textes qu'une langue n'a pas encore. Ne bloque rien : la traduction n'est pas
// obligatoire, mais un manque se voit. Lancer : pnpm i18n:missing
import { LANGUAGES, missingKeys } from '../src/i18n/translate.ts'

for (const language of LANGUAGES) {
  const missing = missingKeys(language)
  console.log(`${language}: ${missing.length === 0 ? 'complete' : `${missing.length} to translate`}`)
  for (const key of missing) console.log(`  - ${key}`)
}
