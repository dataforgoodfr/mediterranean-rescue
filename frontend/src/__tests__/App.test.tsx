import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../App'
import { mockServer, renderWithProviders } from '../test-utils'
import { http } from 'msw'

test('shows the API status when the backend answers', async () => {
  mockServer.use(http.get('/api/health', () => Response.json({ status: 'ok' })))

  renderWithProviders(<App />)
  expect(screen.getByRole('heading', { name: 'Rescue Atlas' })).toBeInTheDocument()
  expect(await screen.findByText('API : ok')).toBeInTheDocument()
})

test('says the backend is unreachable', async () => {
  mockServer.use(http.get('/api/health', () => Response.error()))
  renderWithProviders(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})

test('counts a backend error as unreachable', async () => {
  mockServer.use(http.get('/api/health', () => new Response(null, { status: 500 })))
  renderWithProviders(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})
