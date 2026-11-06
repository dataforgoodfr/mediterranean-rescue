// Liste les textes qu'une langue n'a pas encore. Ne bloque rien : la traduction n'est pas
// obligatoire, mais un manque se voit. Lancer : pnpm i18n:manquantes
import { LANGUES, manquantes } from '../src/i18n/traduire.ts'

for (const langue of LANGUES) {
  const liste = manquantes(langue)
  console.log(`${langue} : ${liste.length === 0 ? 'complet' : `${liste.length} à traduire`}`)
  for (const cle of liste) console.log(`  - ${cle}`)
}
