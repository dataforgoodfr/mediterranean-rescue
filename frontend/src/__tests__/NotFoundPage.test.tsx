import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { NotFound } from '@/pages/NotFound'
import { renderWithProviders } from '@/test-utils'

test('Display not found page', () => {
  renderWithProviders(<NotFound />)
  expect(screen.getByText(/Page introuvable/i)).toBeInTheDocument()
})
