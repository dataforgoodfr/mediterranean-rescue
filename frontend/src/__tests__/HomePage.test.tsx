import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import App from '../App'
import { mockServer, renderWithProviders } from '../test-utils'
import { http } from 'msw'

const operation = (id: number, date: string) => ({
  id,
  date,
  nb_ops: 1,
  operation_type: 'rescue',
  latitude: 34,
  longitude: 15,
  port_disembarkation: 'La Valette',
  nb_survivor: 10,
})

const mockApi = (operations: unknown) => {
  mockServer.use(
    http.get('/api/health', () => Response.json({ status: 'ok' })),
    http.all('/api/operations', () => Response.json(operations)),
  )
}

describe('latest operation date', () => {
  test('is shown when operations exist', async () => {
    mockApi([operation(1, '2026-10-01'), operation(2, '2026-11-03')])
    renderWithProviders(<App />)
    expect(await screen.findByText('Dernière opération : 3 novembre 2026')).toBeInTheDocument()
  })

  test('is hidden when there is no operation', async () => {
    mockApi([])
    renderWithProviders(<App />)
    expect(await screen.findByText(/API : ok/)).toBeInTheDocument()
    expect(screen.queryByText(/Dernière opération/)).not.toBeInTheDocument()
  })

  test('is hidden when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderWithProviders(<App />)

    expect(await screen.findByText(/injoignable/)).toBeInTheDocument()
    expect(screen.queryByText(/Dernière opération/)).not.toBeInTheDocument()
  })
})
