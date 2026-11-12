import { createContext } from 'react'
import type { Language } from './translate.ts'

// La langue choisie, partagée par toute l'app. https://react.dev/reference/react/createContext
export const LanguageContext = createContext<Language>('en')
