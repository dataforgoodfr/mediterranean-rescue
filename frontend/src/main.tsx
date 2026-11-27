import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { detectLanguage, LanguageFromUrl } from './i18n'

// Le cache des appels à l'API, partagé par toute l'app. https://tanstack.com/query/latest
const queryClient = new QueryClient()

// index.html porte toujours #root ; s'il manque, on le dit au lieu de faire comme s'il était là.
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('index.html: #root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      {/* La langue de `?lang=`, sinon celle du navigateur. */}
      <LanguageFromUrl fallback={detectLanguage(navigator.languages)}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </LanguageFromUrl>
    </BrowserRouter>
  </StrictMode>,
)
