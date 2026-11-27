import type { Translations } from './keys.ts'

// L'arabe : il s'écrit de droite à gauche, et l'app passe alors en `dir="rtl"`. Une clé
// absente s'affiche en anglais.
// À remplir par une personne qui lit l'arabe, puis à faire relire avant la mise en production :
// pas de traduction automatique (CONTRIBUTING.md, « Les langues »). Seul le nom de la langue est
// là, pour qu'un lecteur arabophone la trouve dans le menu des langues.
export const ar: Translations = {
  'language.name': 'العربية',
}
