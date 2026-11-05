import { createContext } from 'react'
import type { Langue } from './traduire.ts'

// La langue choisie, partagée par toute l'app. https://react.dev/reference/react/createContext
export const ContexteLangue = createContext<Langue>('en')
