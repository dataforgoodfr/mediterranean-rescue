import { Map, NavigationControl, useMap, type ErrorEvent } from '@vis.gl/react-maplibre'
import { GPUInitializationError, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from '../i18n'
import { CENTRAL_MEDITERRANEAN, MEDITERRANEAN } from './bounds'

// MapLibre 6 derrière un bundler : on lui dit une fois où est son worker, avec l'URL que Vite
// construit. https://maplibre.org/maplibre-gl-js/docs/ (Installation, Vite)
setWorkerUrl(workerUrl)

// Le fond de carte d'OpenFreeMap : libre, sans compte ni clé. Positron reste discret, pour que
// les opérations et les zones posées dessus se lisent. https://openfreemap.org/quick_start/
const BASE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

// Le zoom d'arrivée sur une opération : assez proche pour voir la côte, assez large pour la
// situer en Méditerranée.
const FOCUS_ZOOM = 7

type MapFocus = { latitude: number; longitude: number }

// Déplace la carte vers l'opération ouverte. Le mouvement se coupe si le navigateur demande
// moins d'animation (préférence d'accessibilité).
function FocusOnOperation({ focus }: { focus: MapFocus }) {
  const map = useMap()

  useEffect(() => {
    const instance = map.current
    if (!instance) return

    const center: [number, number] = [focus.longitude, focus.latitude]
    const zoom = Math.max(instance.getZoom(), FOCUS_ZOOM)
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) instance.jumpTo({ center, zoom })
    else instance.flyTo({ center, zoom, duration: 800 })
  }, [map, focus.latitude, focus.longitude])

  return null
}

// Le fond de carte MapLibre. Les couches (opérations, ports, zones) viennent comme enfants
// de <Map>. https://visgl.github.io/react-maplibre/docs/api-reference/map
export default function BaseMap({
  children,
  focus,
}: {
  children?: ReactNode
  focus?: MapFocus | null
}) {
  const t = useTranslation()
  // MapLibre dessine avec WebGL2. Sans lui (vieux navigateur, accélération coupée), il lève
  // GPUInitializationError : on le dit avec une phrase plutôt que de laisser un cadre vide.
  const [unavailable, setUnavailable] = useState(false)
  // Les autres erreurs (une tuile qui ne charge pas) laissent la carte en place : on les garde
  // dans la console, comme le fait react-maplibre sans onError.
  const handleError = (event: ErrorEvent) => {
    if (event.error instanceof GPUInitializationError) setUnavailable(true)
    else console.error(event.error)
  }

  if (unavailable) return <p className="ra-map__message">{t('map.unavailable')}</p>

  return (
    <Map
      initialViewState={{ bounds: CENTRAL_MEDITERRANEAN }}
      // On ne sort pas de la Méditerranée, comme sur la carte actuelle.
      maxBounds={MEDITERRANEAN}
      mapStyle={BASE_MAP_STYLE}
      onError={handleError}
      // Les textes des boutons de MapLibre, dans la langue de l'app.
      locale={{
        'Map.Title': t('map.label'),
        'NavigationControl.ZoomIn': t('map.zoomIn'),
        'NavigationControl.ZoomOut': t('map.zoomOut'),
        'AttributionControl.ToggleAttribution': t('map.attribution'),
      }}
    >
      <NavigationControl showCompass={false} />
      {focus && <FocusOnOperation focus={focus} />}
      {children}
    </Map>
  )
}
