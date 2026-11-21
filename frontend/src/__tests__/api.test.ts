import {getLatestOperation} from '@/api'
import { expect, test, vi, describe } from 'vitest'

const mockFetch = (body: unknown, status = 200) => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      return Response.json(body, { status })
    }))
}

describe('getLatestOperation', () => {
  test('return a date object', async () => {
    mockFetch([{ date: '2026-10-01' }, { date: '2027-11-03' }])

    expect(await getLatestOperation()).toEqual({ date: '2027-11-03' })
  })
  test('returns null when the list is empty', async () => {
    mockFetch([])
    expect(await getLatestOperation()).toBeNull()
  })
  test('throws when the response is not ok', async () => {
    mockFetch([], 500)
    await expect(getLatestOperation()).rejects.toThrow('API: 500')
  })
})
