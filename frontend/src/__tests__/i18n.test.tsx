import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { choisirLangue, direction, manquantes, traduire } from '../i18n'
import { renderAvecApp } from '../test-utils'

test('prend la langue du navigateur, et l’anglais si elle n’est pas prévue', () => {
  expect(choisirLangue(['fr-FR', 'en'])).toBe('fr')
  expect(choisirLangue(['ar-MA'])).toBe('ar')
  expect(choisirLangue(['de-DE', 'it'])).toBe('en')
  expect(choisirLangue([])).toBe('en')
})

test('une traduction absente s’affiche en anglais, sans casser l’app', () => {
  expect(traduire('ar', 'accueil.intro')).toBe(traduire('en', 'accueil.intro'))
  expect(manquantes('ar')).toContain('accueil.intro')
  expect(manquantes('en')).toEqual([])
})

test('remplace les valeurs du texte', () => {
  expect(traduire('fr', 'accueil.api', { etat: 'ok' })).toBe('API : ok')
})

test('l’arabe passe la page de droite à gauche', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  expect(direction('ar')).toBe('rtl')
  renderAvecApp(<App />, { langue: 'ar' })
  expect(await screen.findByText('API: ok')).toBeInTheDocument()
  expect(document.documentElement.dir).toBe('rtl')
  expect(document.documentElement.lang).toBe('ar')
})

test('la page d’accueil existe en anglais', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderAvecApp(<App />, { langue: 'en' })
  expect(
    screen.getByText('The map of SOS MEDITERRANEE rescue operations is coming soon.'),
  ).toBeInTheDocument()
})
