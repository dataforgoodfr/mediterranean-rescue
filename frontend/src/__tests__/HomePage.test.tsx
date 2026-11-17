import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { renderWithProviders } from '../test-utils'

test('Showing last operation date on home page', async () => {
 vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ date: '2026-11-03T10:00:00Z' })))
  renderWithProviders(<App />)
  expect(await screen.findByText('Dernière opération : 3 novembre 2026')).toBeInTheDocument()
})

test('Not showing last operation date on home page', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  renderWithProviders(<App />)

  expect(await screen.findByText(/injoignable/)).toBeInTheDocument()
  expect(screen.queryByText(/Dernière opération/)).not.toBeInTheDocument()
})
