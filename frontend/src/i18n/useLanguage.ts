import { useContext } from 'react'
import { LanguageContext } from './context.ts'

export function useLanguage() {
  return useContext(LanguageContext)
}
