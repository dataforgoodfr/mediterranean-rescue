import { describe, expect, test } from 'vitest'
import { parseOperationId } from './operationId'

describe('parseOperationId', () => {
  test('lit un entier positif', () => {
    expect(parseOperationId('42')).toBe(42)
  })

  test('refuse un identifiant absent', () => {
    expect(parseOperationId(undefined)).toBeNull()
  })

  test.each(['', '0', '-1', '1.5', 'abc', '42a', '9007199254740992'])('refuse « %s »', (raw) => {
    expect(parseOperationId(raw)).toBeNull()
  })
})
