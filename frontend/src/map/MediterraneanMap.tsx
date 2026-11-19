import { lazy, Suspense } from 'react'
import { useTranslation } from '../i18n'
import './map.css'

// MapLibre pèse plus d'un mégaoctet : il arrive dans un fichier à part, après le reste de la
// page. Le temps qu'il charge, le cadre de la carte reste en place, sur le fond de bloc.
// https://react.dev/reference/react/lazy
const BaseMap = lazy(() => import('./BaseMap'))

// La carte de la page d'accueil, avec son nom pour les lecteurs d'écran.
export function MediterraneanMap() {
  const t = useTranslation()
  return (
    <section className="ra-map" aria-label={t('map.label')}>
      <Suspense>
        <BaseMap />
      </Suspense>
    </section>
  )
}
