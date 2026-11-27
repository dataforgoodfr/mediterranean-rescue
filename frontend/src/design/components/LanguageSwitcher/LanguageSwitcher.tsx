import { Link, useSearchParams } from 'react-router'
import { translate, LANGUAGES, useLanguage, useTranslation } from '@/i18n'
import './LanguageSwitcher.css'

// Le menu des langues : un lien par langue, qui écrit `?lang=xx` dans l'adresse. Chaque langue
// porte son propre nom, écrit dans sa langue, pour qu'on la reconnaisse sans lire les autres.
export function LanguageSwitcher() {
  const t = useTranslation()
  const current = useLanguage()
  const [searchParams] = useSearchParams()

  return (
    <nav className="ra-language-switcher" aria-label={t('language.choose')}>
      <ul>
        {LANGUAGES.map((language) => {
          // On garde les autres paramètres de l'adresse.
          const params = new URLSearchParams(searchParams)
          params.set('lang', language)
          return (
            <li key={language}>
              <Link
                to={{ search: params.toString() }}
                lang={language}
                hrefLang={language}
                aria-current={language === current ? 'true' : undefined}
              >
                {translate(language, 'language.name')}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
