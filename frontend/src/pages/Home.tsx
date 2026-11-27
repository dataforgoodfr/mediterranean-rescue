import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getHealth, getOperations } from '../api'
import { Icon, Logo } from '../design'
import { MediterraneanMap } from '../map/MediterraneanMap'
import { useTranslation, useLanguage } from '../i18n'
import { formatLongDate } from '@/utils/formatLongDate'
import { parseOperationId } from '@/utils/operationId'

// La page d'accueil : la carte, et l'état de l'API en dessous tant que la carte ne lit rien.
export function Home() {
  const t = useTranslation()
  const language = useLanguage()
  const params = useParams()
  const navigate = useNavigate()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const operationsQuery = useQuery({
    queryKey: ['operations'],
    queryFn: getOperations,
  })

  const status = health.isPending
    ? t('home.apiStatus.pending')
    : health.isError
      ? t('home.apiStatus.unreachable')
      : t('home.apiStatus.ok')

  // L'opération vient de l'adresse (/operations/42) : copier l'adresse suffit à la rouvrir.
  // Une opération absente de la liste n'est signalée qu'une fois la liste chargée, pour ne pas
  // afficher « introuvable » pendant la requête ni quand l'API ne répond pas.
  const operations = operationsQuery.data ?? []
  const requestedId = parseOperationId(params.id)
  const selected =
    requestedId === null ? undefined : operations.find((operation) => operation.id === requestedId)
  const notFound = operationsQuery.isSuccess && params.id !== undefined && selected === undefined

  const selectOperation = (operationId: number) => {
    void navigate(`/operations/${operationId}`)
  }

  // La fiche écoute cette fonction : elle doit garder la même identité, sinon son effet se
  // relance à chaque rendu de la page et reprend le focus.
  const closeOperation = useCallback(() => {
    void navigate('/', { replace: true })
  }, [navigate])

  // La route renvoie les opérations de la plus ancienne à la plus récente.
  const latestOperation = operationsQuery.data?.at(-1)
  const latestOperationDate = latestOperation
    ? formatLongDate(latestOperation.date, language)
    : null
  return (
    <main>
      <Logo />
      <h1>{t('home.title')}</h1>
      {notFound && (
        <p className="ra-block" role="status">
          {t('operation.notFound')}
        </p>
      )}
      <MediterraneanMap
        operations={operations}
        selectedId={selected?.id ?? null}
        onSelect={selectOperation}
        onClose={closeOperation}
      />
      {latestOperationDate && (
        <p>
          {t('home.lastOperationDate', {
            date: latestOperationDate,
          })}
        </p>
      )}
      <p className="ra-block">
        <Icon name="lifebuoy" /> {t('home.apiStatus', { status })}
      </p>
    </main>
  )
}
