import { expect, test } from 'vitest'
import { formatLongDate } from './formatLongDate'

test('formats a date with the month spelled out', () => {
  expect(formatLongDate('2026-11-03T10:00:00Z', 'fr')).toBe('3 novembre 2026')
  expect(formatLongDate('2026-11-03T10:00:00Z', 'en')).toBe('November 3, 2026')
})