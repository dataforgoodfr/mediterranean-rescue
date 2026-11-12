import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Icon, icons, Logo } from '../design'

test('the logo is an image named SOS MEDITERRANEE', () => {
  render(<Logo />)
  expect(screen.getByRole('img', { name: 'SOS MEDITERRANEE' })).toBeInTheDocument()
})

test('loads every icon of the brand guidelines', () => {
  expect(Object.keys(icons)).toHaveLength(53)
  expect(icons.lifebuoy).toBeTruthy()
})

test('an icon with a label is read by screen readers', () => {
  render(<Icon name="anchor" label="Disembarkation port" />)
  expect(screen.getByRole('img', { name: 'Disembarkation port' })).toBeInTheDocument()
})

test('an icon without a label is decorative, an unknown name renders nothing', () => {
  const { container } = render(
    <>
      <Icon name="anchor" />
      <Icon name="unknown" />
      <Icon name="toString" />
    </>,
  )
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(container.querySelectorAll('.ra-icon')).toHaveLength(1)
})
