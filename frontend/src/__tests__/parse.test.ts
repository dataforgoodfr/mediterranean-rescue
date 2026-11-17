import { expect, test } from 'vitest'
import {isDateString} from '../parse'

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
