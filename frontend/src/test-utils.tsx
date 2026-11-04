import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

// Affiche un composant avec ce que l'app lui fournit : le cache de l'API et le routeur.
// Un cache neuf par test, sans nouvelle tentative, sinon un test d'erreur attend trois essais.
// https://tanstack.com/query/latest/docs/framework/react/guides/testing
export function renderAvecApp(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
