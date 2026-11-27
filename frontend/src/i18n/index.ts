// Les langues de l'app : anglais, français, arabe (optionnel). Mode d'emploi : TECHNICAL.md
// (« Les langues »).
export { LanguageFromUrl } from './LanguageFromUrl.tsx'
export { LanguageProvider } from './LanguageProvider.tsx'
export {
  detectLanguage,
  direction,
  isLanguage,
  LANGUAGES,
  missingKeys,
  translate,
  type Language,
} from './translate.ts'
export { useTranslation } from './useTranslation.ts'
export { useLanguage } from './useLanguage.ts'
