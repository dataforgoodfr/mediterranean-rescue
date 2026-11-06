import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { FournisseurLangue, type Langue } from './i18n'

// Affiche un composant avec ce que l'app lui fournit : la langue (le français par défaut dans
// les tests), le cache de l'API et le routeur.
// Un cache neuf par test, sans nouvelle tentative, sinon un test d'erreur attend trois essais.
// https://tanstack.com/query/latest/docs/framework/react/guides/testing
export function renderAvecApp(
  ui: ReactElement,
  { route = '/', langue = 'fr' }: { route?: string; langue?: Langue } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <FournisseurLangue langue={langue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </FournisseurLangue>,
  )
}
