import { lazy, Suspense } from 'react'
import type { MapOperation } from '@/api'
import { useLanguage, useTranslation } from '../i18n'
import './map.css'
import { OperationMarker } from './OperationMarker'
import { OperationSheet } from './OperationSheet'

// MapLibre pèse plus d'un mégaoctet : il arrive dans un fichier à part, après le reste de la
// page. Le temps qu'il charge, le cadre de la carte reste en place, sur le fond de bloc.
// https://react.dev/reference/react/lazy
const BaseMap = lazy(() => import('./BaseMap'))

type MediterraneanMapProps = {
  operations?: MapOperation[]
  selectedId: number | null
  onSelect: (id: number) => void
  onClose: () => void
}

// La carte de la page d'accueil, avec son nom pour les lecteurs d'écran. La sélection vient de
// la page, qui la lit dans l'adresse : la carte ne garde pas d'état à elle.
export function MediterraneanMap({
  operations = [],
  selectedId,
  onSelect,
  onClose,
}: MediterraneanMapProps) {
  const t = useTranslation()
  const language = useLanguage()

  const selected =
    selectedId === null ? undefined : operations.find((operation) => operation.id === selectedId)
  const focus =
    selected !== undefined &&
    typeof selected.latitude === 'number' &&
    typeof selected.longitude === 'number'
      ? { latitude: selected.latitude, longitude: selected.longitude }
      : null

  return (
    <section className="ra-map" aria-label={t('map.label')}>
      <Suspense>
        <BaseMap focus={focus}>
          {operations.map((operation) => (
            <OperationMarker
              key={operation.id}
              operation={operation}
              language={language}
              selected={operation.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </BaseMap>
      </Suspense>
      {selected && <OperationSheet operation={selected} language={language} onClose={onClose} />}
    </section>
  )
}
