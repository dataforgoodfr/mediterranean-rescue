import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { renderAvecApp } from '../test-utils'

test("affiche l'état de l'API quand le backend répond", async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderAvecApp(<App />)
  expect(screen.getByRole('heading', { name: 'Rescue Atlas' })).toBeInTheDocument()
  expect(await screen.findByText('API : ok')).toBeInTheDocument()
})

test('dit que le backend est injoignable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')))
  renderAvecApp(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})

test('une erreur du backend compte comme injoignable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))
  renderAvecApp(<App />)
  expect(await screen.findByText('API : injoignable')).toBeInTheDocument()
})
