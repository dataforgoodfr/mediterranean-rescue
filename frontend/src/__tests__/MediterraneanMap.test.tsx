import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import type { MapOperation } from '@/api'
import { MediterraneanMap } from '../map/MediterraneanMap'
import { renderWithProviders } from '../test-utils'

// jsdom ne dessine pas la carte : Marker et BaseMap sont remplacés par de simples conteneurs.
vi.mock('@vis.gl/react-maplibre', () => ({
  Marker: ({ children }: { children?: ReactNode }) => children,
}))

vi.mock('../map/BaseMap', () => ({
  default: ({ children }: { children?: ReactNode }) => children,
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

test('shows one point per operation that has a position', async () => {
  renderWithProviders(<MediterraneanMap operations={operations} />)
  expect(await screen.findAllByRole('button')).toHaveLength(2)
})

test('opens the sheet on click with the date, position, port and survivors', async () => {
  renderWithProviders(<MediterraneanMap operations={operations} />)
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Opération du 3 novembre 2026, port : La Valette',
    }),
  )

  const dialog = screen.getByRole('dialog', { name: 'Opération du 3 novembre 2026' })
  expect(within(dialog).getByText('3 novembre 2026')).toBeInTheDocument()
  expect(within(dialog).getByText('34,5° N, 15,2° E')).toBeInTheDocument()
  expect(within(dialog).getByText('La Valette')).toBeInTheDocument()
  expect(within(dialog).getByText('38')).toBeInTheDocument()
})

test('opens the sheet with Enter', async () => {
  const user = userEvent.setup()
  renderWithProviders(<MediterraneanMap operations={operations} />)
  const marker = await screen.findByRole('button', { name: /3 novembre 2026/ })
  marker.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('shows "inconnu" when the port and the number are unknown', async () => {
  renderWithProviders(<MediterraneanMap operations={operations} />)
  fireEvent.click(await screen.findByRole('button', { name: /4 novembre 2026/ }))

  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getAllByText('inconnu')).toHaveLength(2)
})

test('Escape closes the sheet and gives focus back to the point', async () => {
  renderWithProviders(<MediterraneanMap operations={operations} />)
  const marker = await screen.findByRole('button', { name: /3 novembre 2026/ })
  marker.focus()
  fireEvent.click(marker)
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(marker).toHaveFocus()
})

test('keeps Tab inside the sheet', async () => {
  renderWithProviders(<MediterraneanMap operations={operations} />)
  fireEvent.click(await screen.findByRole('button', { name: /3 novembre 2026/ }))

  const close = screen.getByRole('button', { name: 'Fermer' })
  expect(close).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Tab' })
  expect(close).toHaveFocus()
})
