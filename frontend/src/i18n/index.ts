// Les langues de l'app : anglais, français, arabe (optionnel). Mode d'emploi : TECHNICAL.md
// (« Les langues »).
export { LanguageProvider } from './LanguageProvider.tsx'
export {
  detectLanguage,
  direction,
  LANGUAGES,
  missingKeys,
  translate,
  type Language,
} from './translate.ts'
export { useTranslation } from './useTranslation.ts'
