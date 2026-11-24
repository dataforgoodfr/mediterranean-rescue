import { Marker } from '@vis.gl/react-maplibre'
import type { MapOperation } from '@/api'
import { Icon } from '@/design'
import type { Language } from '@/i18n/translate'
import { useTranslation } from '@/i18n'
import { formatLongDate } from '@/utils/formatLongDate'

type OperationMarkerProps = {
  operation: MapOperation
  language: Language
  selected: boolean
  onSelect: (id: number) => void
}

// Un point sur la carte pour une opération. C'est un bouton natif : le clic, Entrée et Espace
// l'activent sans code supplémentaire. Le picto SOS est ancré par sa pointe, qui désigne la
// position exacte.
export function OperationMarker({ operation, language, selected, onSelect }: OperationMarkerProps) {
  const t = useTranslation()
  const latitude = operation.latitude
  const longitude = operation.longitude
  // Sans position, pas de point : l'opération reste dans l'API, mais pas sur la carte.
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null

  const port = operation.port_disembarkation
    ? operation.port_disembarkation
    : t('operation.unknown')

  const className = selected
    ? 'ra-map__marker-button ra-map__marker-button--selected'
    : 'ra-map__marker-button'

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <button
        type="button"
        className={className}
        onClick={() => onSelect(operation.id)}
        aria-haspopup="dialog"
        aria-label={t('operation.markerLabel', {
          date: formatLongDate(operation.date, language),
          port,
        })}
      >
        <Icon name="sos-marker" size="var(--size-marker)" />
      </button>
    </Marker>
  )
}
