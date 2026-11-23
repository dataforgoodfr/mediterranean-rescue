import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { renderWithProviders } from '../test-utils'

// jsdom n'a pas WebGL2 : MapLibre ne peut pas y dessiner. Ces tests vérifient que la page
// d'accueil porte la carte, et ce que voit un navigateur sans WebGL2. Le dessin lui-même se
// vérifie dans un vrai navigateur : `task dev`, puis la page d'accueil.

test('the home page shows the map of the central Mediterranean', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />)
  expect(
    screen.getByRole('region', { name: 'Carte de la Méditerranée centrale' }),
  ).toBeInTheDocument()
})

test('says so when the browser cannot draw the map', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />)
  expect(await screen.findByText(/Ce navigateur ne peut pas afficher la carte/)).toBeInTheDocument()
})
