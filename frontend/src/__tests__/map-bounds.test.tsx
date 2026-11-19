import { expect, test, vi } from 'vitest'
import BaseMap from '../map/BaseMap'
import { CENTRAL_MEDITERRANEAN, MEDITERRANEAN, type Bounds } from '../map/bounds'
import { renderWithProviders } from '../test-utils'

// jsdom ne dessine pas la carte : on remplace le composant <Map> de react-maplibre par un faux
// qui garde ce qu'il reçoit, pour vérifier comment BaseMap le règle.
type MapProps = { initialViewState?: { bounds?: Bounds }; maxBounds?: Bounds }
const received = vi.hoisted((): { props?: MapProps } => ({}))
vi.mock('@vis.gl/react-maplibre', () => ({
  Map: (props: MapProps) => {
    received.props = props
    return null
  },
  NavigationControl: () => null,
}))

test('the map opens on the central Mediterranean and stays in the Mediterranean', () => {
  renderWithProviders(<BaseMap />)
  expect(received.props?.initialViewState?.bounds).toEqual(CENTRAL_MEDITERRANEAN)
  expect(received.props?.maxBounds).toEqual(MEDITERRANEAN)
})

test('the opening view fits inside the limits', () => {
  const [west, south, east, north] = CENTRAL_MEDITERRANEAN
  const [minWest, minSouth, maxEast, maxNorth] = MEDITERRANEAN
  expect(west).toBeGreaterThanOrEqual(minWest)
  expect(south).toBeGreaterThanOrEqual(minSouth)
  expect(east).toBeLessThanOrEqual(maxEast)
  expect(north).toBeLessThanOrEqual(maxNorth)
})
