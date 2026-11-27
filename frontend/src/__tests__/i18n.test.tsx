import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { detectLanguage, direction, isLanguage, missingKeys, translate } from '../i18n'
import { renderWithProviders } from '../test-utils'

test('takes the browser language, and English when it is not available', () => {
  expect(detectLanguage(['fr-FR', 'en'])).toBe('fr')
  expect(detectLanguage(['ar-MA'])).toBe('ar')
  expect(detectLanguage(['de-DE', 'it'])).toBe('en')
  expect(detectLanguage([])).toBe('en')
})

test('a missing translation falls back to English without breaking the app', () => {
  expect(translate('ar', 'home.intro')).toBe(translate('en', 'home.intro'))
  expect(missingKeys('ar')).toContain('home.intro')
  expect(missingKeys('en')).toEqual([])
})

test('replaces the values in the text', () => {
  expect(translate('fr', 'home.apiStatus', { status: 'ok' })).toBe('API : ok')
})

test('Arabic switches the page to right to left', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  expect(direction('ar')).toBe('rtl')
  renderWithProviders(<App />, { language: 'ar' })
  expect(await screen.findByText('API: ok')).toBeInTheDocument()
  expect(document.documentElement.dir).toBe('rtl')
  expect(document.documentElement.lang).toBe('ar')
})

test('the home page exists in English', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />, { language: 'en' })
  expect(screen.getByText('Rescue Atlas')).toBeInTheDocument()
})

test('recognises the languages of the app, and only them', () => {
  expect(isLanguage('ar')).toBe(true)
  expect(isLanguage('fr')).toBe(true)
  expect(isLanguage('de')).toBe(false)
  expect(isLanguage('')).toBe(false)
})

test('?lang=ar opens the map in Arabic, right to left', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />, { route: '/?lang=ar' })
  expect(await screen.findByText('API: ok')).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('ar')
  expect(document.documentElement.dir).toBe('rtl')
})

test('an unknown ?lang keeps the default language', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />, { route: '/?lang=xx' })
  expect(document.documentElement.lang).toBe('fr')
  expect(document.documentElement.dir).toBe('ltr')
})

test('the language menu of the home page switches to Arabic', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
  renderWithProviders(<App />)
  const menu = screen.getByRole('navigation', { name: 'Langue' })
  const links = within(menu).getAllByRole('link')
  expect(links.map((link) => link.textContent)).toEqual(['English', 'Français', 'العربية'])
  expect(within(menu).getByRole('link', { name: 'Français' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  fireEvent.click(within(menu).getByRole('link', { name: 'العربية' }))
  expect(document.documentElement.lang).toBe('ar')
  expect(document.documentElement.dir).toBe('rtl')
  expect(screen.getByRole('link', { name: 'العربية' })).toHaveAttribute('aria-current', 'true')
})
