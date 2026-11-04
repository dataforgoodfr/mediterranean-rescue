import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api'
import { Logo, Picto } from '../design'

// Une page provisoire : elle montre seulement que le frontend parle au backend.
// La carte arrive par une issue.
export function Accueil() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const api = health.isPending ? 'en attente' : health.isError ? 'injoignable' : 'ok'

  return (
    <main>
      <Logo />
      <h1>Rescue Atlas</h1>
      <p>La carte des opérations de sauvetage de SOS MEDITERRANEE arrive bientôt.</p>
      <p className="ra-bloc">
        <Picto name="lifebuoy" /> API : {api}
      </p>
    </main>
  )
}
