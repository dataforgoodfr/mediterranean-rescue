import { expect, test } from 'vitest'
import { isRecord } from '@/parse'

test('the @/ alias points to src/', () => {
  expect(isRecord({})).toBe(true)
})
