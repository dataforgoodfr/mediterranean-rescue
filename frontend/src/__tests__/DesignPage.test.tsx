import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../App'
import { icons } from '../design'
import { renderWithProviders } from '../test-utils'

test('the /design page shows every icon with its name', () => {
  renderWithProviders(<App />, { route: '/design' })
  const names = Object.keys(icons)
  expect(names).toHaveLength(53)
  for (const name of names) {
    expect(screen.getByRole('img', { name })).toBeInTheDocument()
  }
  expect(screen.getByRole('heading', { name: 'Pictos (53)' })).toBeInTheDocument()
})

test('the /design page shows the logo in blue and in white', () => {
  renderWithProviders(<App />, { route: '/design' })
  const logos = screen.getAllByRole('img', { name: 'SOS MEDITERRANEE' })
  expect(logos).toHaveLength(2)
  expect(logos.filter((logo) => logo.classList.contains('ra-logo--white'))).toHaveLength(1)
})

test('the /design page shows the colours of the brand guidelines', () => {
  renderWithProviders(<App />, { route: '/design', language: 'en' })
  const colors = screen.getByRole('heading', { name: 'Colours' }).nextElementSibling
  expect(colors).toBeInstanceOf(HTMLElement)
  if (!(colors instanceof HTMLElement)) return
  for (const token of ['--color-primary', '--color-secondary', '--color-text', '--color-surface']) {
    expect(within(colors).getByText(token)).toBeInTheDocument()
  }
})
