import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { LanguageProvider } from './LanguageProvider.tsx'
import { isLanguage, type Language } from './translate.ts'

// La langue vient de l'adresse (`?lang=ar`), sinon de `fallback` (celle du navigateur). L'adresse
// est la seule source : un lien `?lang=ar` se partage, et le menu des langues n'a qu'à la changer.
// À placer sous le routeur. https://reactrouter.com/api/hooks/useSearchParams
export function LanguageFromUrl({
  fallback,
  children,
}: {
  fallback: Language
  children: ReactNode
}) {
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('lang')
  const language = requested !== null && isLanguage(requested) ? requested : fallback

  return <LanguageProvider language={language}>{children}</LanguageProvider>
}
