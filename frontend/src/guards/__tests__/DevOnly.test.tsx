import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { DevOnly } from '@/guards/DevOnly'
import { renderWithProviders } from '@/test-utils'

const FAKEPAGE_STRING = 'fake page'
const FakePage = (
  <DevOnly>
    <p>{FAKEPAGE_STRING}</p>
  </DevOnly>
)
test('Display fake page only in dev mode', () => {
  vi.stubEnv('DEV', true)
  renderWithProviders(FakePage)
  expect(screen.getByText(FAKEPAGE_STRING)).toBeInTheDocument()
})

test('Display not found page in production mode', () => {
  vi.stubEnv('DEV', false)
  renderWithProviders(FakePage)
  expect(screen.queryByText(FAKEPAGE_STRING)).not.toBeInTheDocument()
  expect(screen.queryByText(/Page introuvable/i)).toBeInTheDocument()
})
