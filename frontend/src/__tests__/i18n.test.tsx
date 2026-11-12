import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../App'
import { detectLanguage, direction, missingKeys, translate } from '../i18n'
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
  expect(
    screen.getByText('The map of SOS MEDITERRANEE rescue operations is coming soon.'),
  ).toBeInTheDocument()
})
