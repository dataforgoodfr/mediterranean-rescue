import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { choisirLangue, FournisseurLangue } from './i18n'

// Le cache des appels à l'API, partagé par toute l'app. https://tanstack.com/query/latest
const queryClient = new QueryClient()

// index.html porte toujours #root ; s'il manque, on le dit au lieu de faire comme s'il était là.
const racine = document.getElementById('root')
if (!racine) throw new Error('index.html : élément #root introuvable')

createRoot(racine).render(
  <StrictMode>
    <FournisseurLangue langue={choisirLangue(navigator.languages)}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </FournisseurLangue>
  </StrictMode>,
)
