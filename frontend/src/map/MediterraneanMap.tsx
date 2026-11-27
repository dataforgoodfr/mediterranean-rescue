import { lazy, Suspense, useCallback, useState } from 'react'
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
}

// La carte de la page d'accueil, avec son nom pour les lecteurs d'écran.
export function MediterraneanMap({ operations = [] }: MediterraneanMapProps) {
  const t = useTranslation()
  const language = useLanguage()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // La fiche écoute cette fonction : elle doit garder la même identité, sinon son effet se
  // relance à chaque rendu de la carte et reprend le focus.
  const closeSheet = useCallback(() => setSelectedId(null), [])

  const selected =
    selectedId === null ? undefined : operations.find((operation) => operation.id === selectedId)

  return (
    <section className="ra-map" aria-label={t('map.label')}>
      <Suspense>
        <BaseMap>
          {operations.map((operation) => (
            <OperationMarker
              key={operation.id}
              operation={operation}
              language={language}
              selected={operation.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </BaseMap>
      </Suspense>
      {selected && <OperationSheet operation={selected} language={language} onClose={closeSheet} />}
    </section>
  )
}
