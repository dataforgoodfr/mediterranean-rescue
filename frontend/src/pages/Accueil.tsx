import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api'
import { Logo, Picto } from '../design'
import { useTraduction } from '../i18n'

// Une page provisoire : elle montre seulement que le frontend parle au backend.
// La carte arrive par une issue.
export function Accueil() {
  const t = useTraduction()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const etat = health.isPending
    ? t('accueil.api.attente')
    : health.isError
      ? t('accueil.api.injoignable')
      : t('accueil.api.ok')

  return (
    <main>
      <Logo />
      <h1>{t('accueil.titre')}</h1>
      <p>{t('accueil.intro')}</p>
      <p className="ra-bloc">
        <Picto name="lifebuoy" /> {t('accueil.api', { etat })}
      </p>
    </main>
  )
}
