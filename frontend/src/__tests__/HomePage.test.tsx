import { screen } from '@testing-library/react'
import { expect, test, vi, describe } from 'vitest'
import App from '../App'
import { renderWithProviders } from '../test-utils'

const mockApi = (operations: unknown) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url.endsWith('/api/health')) return Response.json({ status: 'ok' })
      return Response.json(operations)
    }),
  )
}

describe('latest operation date', () => {
  test('is shown when operations exist', async () => {
    mockApi([{ date: '2026-10-01' }, { date: '2026-11-03' }])
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
