import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { LanguageFromUrl, type Language } from './i18n'

// Affiche un composant avec ce que l'app lui fournit : le routeur, la langue (celle de `?lang=`
// dans `route`, sinon `language`, le français par défaut dans les tests) et le cache de l'API.
// Un cache neuf par test, sans nouvelle tentative, sinon un test d'erreur attend trois essais.
// https://tanstack.com/query/latest/docs/framework/react/guides/testing
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', language = 'fr' }: { route?: string; language?: Language } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageFromUrl fallback={language}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </LanguageFromUrl>
    </MemoryRouter>,
  )
}
