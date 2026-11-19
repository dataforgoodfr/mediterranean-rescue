import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api'
import { Icon, Logo } from '../design'
import { useTranslation } from '../i18n'
import { MediterraneanMap } from '../map/MediterraneanMap'

// La page d'accueil : la carte, et l'état de l'API en dessous tant que la carte ne lit rien.
export function Home() {
  const t = useTranslation()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')

  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <MediterraneanMap />
      <p className="ra-block">
        <Icon name="lifebuoy" /> {t('home.apiStatus', { status })}
      </p>
    </main>
  )
}
