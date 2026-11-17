import { useQuery } from '@tanstack/react-query'
import { getHealth, getOperations } from '@/api'
import { Icon, Logo } from '@/design'
import { MediterraneanMap } from '@/map/MediterraneanMap'
import { useTranslation, useLanguage } from '@/i18n'
import {formatLongDate} from '../utils/formatLongDate'
// Une page provisoire : elle montre seulement que le frontend parle au backend.
// La carte arrive par une issue.
export function Home() {
  const t = useTranslation()
  const language = useLanguage()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const operations = useQuery({queryKey: ['operations'], queryFn: getOperations})

  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')
  const lastOperationDate = operations.isSuccess ? formatLongDate(operations.data.date, language) : null

  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <MediterraneanMap />
      { lastOperationDate && <p>{t('home.lastOperationDate', { date: lastOperationDate })}</p> }
      <p className="ra-block">
        <Icon name="lifebuoy" /> {t('home.apiStatus', { status })}
      </p>
    </main>
  )
}
