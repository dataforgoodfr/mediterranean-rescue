import { useQuery } from '@tanstack/react-query'
import { getHealth, getLatestOperation } from '../api'
import { Icon, Logo } from '../design'
import { MediterraneanMap } from '../map/MediterraneanMap'
import { useTranslation, useLanguage } from '../i18n'
import { formatLongDate } from '@/utils/formatLongDate'

// La page d'accueil : la carte, et l'état de l'API en dessous tant que la carte ne lit rien.
export function Home() {
  const t = useTranslation()
  const language = useLanguage()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const latestOperationQuery = useQuery({
    queryKey: ['latestOperation'],
    queryFn: getLatestOperation,
  })

  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')

  const latestOperationDate = latestOperationQuery.data
    ? formatLongDate(latestOperationQuery.data.date, language)
    : null
  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <MediterraneanMap />
      {latestOperationDate && (
        <p>
          {t('home.lastOperationDate', {
            date: latestOperationDate,
          })}
        </p>
      )}
      <p className="ra-block">
        <Icon name="lifebuoy" /> {t('home.apiStatus', { status })}
      </p>
    </main>
  )
}
