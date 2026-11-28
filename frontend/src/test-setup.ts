// Lancé avant chaque fichier de test (vite.config.ts, test.setupFiles).
import '@testing-library/jest-dom/vitest' // toBeInTheDocument, toHaveTextContent…
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { mockServer } from './test-utils'

beforeAll(() => {
  mockServer.listen({ onUnhandledFrame: 'bypass' })
})

// Sans les globals de Vitest, Testing Library ne nettoie pas tout seul entre deux tests.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  mockServer.resetHandlers()
})

afterAll(() => mockServer.close())
