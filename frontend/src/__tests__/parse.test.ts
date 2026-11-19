import { expect, test, describe } from 'vitest'
import { isArray, isDateString } from '../parse'

const dateString = '2026-11-03T10:00:00Z'
const objectToParse = {test: 'toto'}
test(`Parsing ${dateString} in isDateString function expect to be truthy`, () => {
    expect(isDateString(dateString)).toBeTruthy()
})

test(`Parsing 'hello' in isDateString function expect to be falsy`, () => {
    expect(isDateString('hello')).toBeFalsy()
})

test(`Parsing ${JSON.stringify(objectToParse)} in isDateString function expect to be falsy`, () => {
    expect(isDateString(objectToParse)).toBeFalsy()
})

describe('isArray', () => {

  test.each([
    {value: []},
    {value: [1, {toto:'titi'}, 'abc', false]}
  ])('returns true for $value', ({ value }) => {
    expect(isArray(value)).toBe(true)
  })

  test.each([
    null,
    undefined,
    {},
    { length: 0 },
    'abc',
    42,
  ])('returns false for %o', (value) => {
    expect(isArray(value)).toBe(false)
  })
})
