import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/api'
import { Icon, Logo } from '@/design'
import { MediterraneanMap } from '@/map/MediterraneanMap'
import { useTranslation, useLanguage } from '@/i18n'

// Une page provisoire : elle montre seulement que le frontend parle au backend.
// La carte arrive par une issue.
// A refacto quand on aura la date de dispo via API
const PLACEHOLDER_DATE = new Date()

export function Home() {
  const t = useTranslation()
  const language = useLanguage()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')

  // Changer la lastOperationDate quand dispo via API
  const lastOperationDate = PLACEHOLDER_DATE.toLocaleDateString(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <MediterraneanMap />
      <p>{t('home.lastOperationDate', { date: lastOperationDate })}</p>
      <p className="ra-block">
        <Icon name="lifebuoy" /> {t('home.apiStatus', { status })}
      </p>
    </main>
  )
}
