import { act, fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { expect, test, vi } from 'vitest'
import type { MapOperation } from '@/api'
import App from '../App'
import { renderWithProviders } from '../test-utils'

// jsdom ne dessine pas la carte : on remplace Marker et BaseMap par des conteneurs. BaseMap
// expose la position vers laquelle la carte doit se déplacer, pour vérifier le lien.
vi.mock('@vis.gl/react-maplibre', () => ({
  Marker: ({ children }: { children?: ReactNode }) => children,
}))

vi.mock('../map/BaseMap', () => ({
  default: ({
    children,
    focus,
  }: {
    children?: ReactNode
    focus?: { latitude: number; longitude: number } | null
  }) => (
    <div data-testid="base-map" data-latitude={focus?.latitude} data-longitude={focus?.longitude}>
      {children}
    </div>
  ),
}))

const operations: MapOperation[] = [
  {
    id: 1,
    date: '2026-11-03',
    latitude: 34.5,
    longitude: 15.2,
    port_disembarkation: 'La Valette',
    nb_survivor: 38,
  },
  {
    id: 2,
    date: '2026-11-04',
    latitude: 35.1,
    longitude: 16.8,
    port_disembarkation: null,
    nb_survivor: null,
  },
  {
    id: 3,
    date: '2026-11-05',
    latitude: null,
    longitude: null,
    port_disembarkation: 'Ravenne',
    nb_survivor: 12,
  },
]

const mockApi = (items: unknown) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url.endsWith('/api/health')) return Response.json({ status: 'ok' })
      return Response.json(items)
    }),
  )
}

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

test('a link to an operation opens its sheet and moves the map to it', async () => {
  mockApi(operations)
  renderWithProviders(<App />, { route: '/operations/1' })

  expect(
    await screen.findByRole('dialog', { name: 'Opération du 3 novembre 2026' }),
  ).toBeInTheDocument()
  const baseMap = screen.getByTestId('base-map')
  expect(baseMap).toHaveAttribute('data-latitude', '34.5')
  expect(baseMap).toHaveAttribute('data-longitude', '15.2')
})

test('a link to an operation without a position still opens its sheet', async () => {
  mockApi(operations)
  renderWithProviders(<App />, { route: '/operations/3' })

  expect(
    await screen.findByRole('dialog', { name: 'Opération du 5 novembre 2026' }),
  ).toBeInTheDocument()
})

test('opening a point puts the operation in the address', async () => {
  mockApi(operations)
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
  )

  fireEvent.click(await screen.findByRole('button', { name: /3 novembre 2026/ }))

  expect(screen.getByTestId('location')).toHaveTextContent('/operations/1')
})

test('closing the sheet returns to the map address', async () => {
  mockApi(operations)
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route: '/operations/1' },
  )

  fireEvent.click(await screen.findByRole('button', { name: 'Fermer' }))

  expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
})

test('an unknown operation opens the map with a clear message', async () => {
  mockApi(operations)
  renderWithProviders(<App />, { route: '/operations/999' })

  expect(await screen.findByText(/Ce lien mène à une opération/)).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(
    screen.getByRole('region', { name: 'Carte de la Méditerranée centrale' }),
  ).toBeInTheDocument()
})

test('an invalid operation id behaves like an unknown operation', async () => {
  mockApi(operations)
  renderWithProviders(<App />, { route: '/operations/abc' })

  expect(await screen.findByText(/Ce lien mène à une opération/)).toBeInTheDocument()
})

test('does not say the operation is missing while the list loads', async () => {
  let respond: (response: Response) => void = () => {}
  const pending = new Promise<Response>((resolve) => {
    respond = resolve
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url.endsWith('/api/health')) return Response.json({ status: 'ok' })
      return pending
    }),
  )

  renderWithProviders(<App />, { route: '/operations/999' })
  expect(screen.queryByText(/Ce lien mène à une opération/)).not.toBeInTheDocument()

  await act(async () => {
    respond(Response.json(operations))
  })
  expect(await screen.findByText(/Ce lien mène à une opération/)).toBeInTheDocument()
})
