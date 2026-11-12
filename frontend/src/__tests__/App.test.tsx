import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { renderWithProviders } from '../test-utils'

test('shows the API status when the backend answers', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />)
  expect(screen.getByRole('heading', { name: 'Rescue Atlas' })).toBeInTheDocument()
  expect(await screen.findByText('API : ok')).toBeInTheDocument()
})

test('says the backend is unreachable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
  renderWithProviders(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})

test('counts a backend error as unreachable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))
  renderWithProviders(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})
