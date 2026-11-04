// Les appels à l'API, un par fonction. Les composants les utilisent avec TanStack Query
// (useQuery), jamais avec fetch dans un useEffect. https://tanstack.com/query/latest

export type Health = { status: string }

export async function getHealth(): Promise<Health> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`API : ${response.status}`)
  return response.json() as Promise<Health>
}
