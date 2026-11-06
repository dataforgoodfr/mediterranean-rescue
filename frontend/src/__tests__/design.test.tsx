import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Logo, Picto, pictos } from '../design'

test('le logo est une image nommée SOS MEDITERRANEE', () => {
  render(<Logo />)
  expect(screen.getByRole('img', { name: 'SOS MEDITERRANEE' })).toBeInTheDocument()
})

test('tous les pictos de la charte sont chargés', () => {
  expect(Object.keys(pictos)).toHaveLength(53)
  expect(pictos.lifebuoy).toBeTruthy()
})

test('un picto avec un texte est lu par les lecteurs d’écran', () => {
  render(<Picto name="anchor" label="Port de débarquement" />)
  expect(screen.getByRole('img', { name: 'Port de débarquement' })).toBeInTheDocument()
})

test('un picto sans texte est décoratif, un nom inconnu ne rend rien', () => {
  const { container } = render(
    <>
      <Picto name="anchor" />
      <Picto name="inconnu" />
      <Picto name="toString" />
    </>,
  )
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(container.querySelectorAll('.ra-picto')).toHaveLength(1)
})
