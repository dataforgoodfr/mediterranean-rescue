import type { ReactNode } from 'react'
import { NotFound } from '@/pages/NotFound'

interface DevOnlyProps {
  children: ReactNode
}

export function DevOnly({ children }: DevOnlyProps) {
  return import.meta.env.DEV ? <>{children}</> : <NotFound />
}
