import { Icon, Logo } from '../design'
import { MediterraneanMap } from '../map/MediterraneanMap'
import { useTranslation, useLanguage } from '../i18n'
import { formatLongDate } from '@/utils/formatLongDate'
import { $api } from '@/api/client'

// La page d'accueil : la carte, et l'état de l'API en dessous tant que la carte ne lit rien.
export function Home() {
  const t = useTranslation()
  const language = useLanguage()
  const health = $api.useQuery('get', '/api/health')
  const operationsQuery = $api.useQuery('get', '/api/operations')

  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')

  // La route renvoie les opérations de la plus ancienne à la plus récente.
  const latestOperation = operationsQuery.data?.at(-1)
  const latestOperationDate = latestOperation
    ? formatLongDate(latestOperation.date, language)
    : null
  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      <MediterraneanMap operations={operationsQuery.data ?? []} />
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
