import { useEffect, useRef } from 'react'
import type { MapOperation } from '@/api/types'
import type { Language } from '@/i18n/translate'
import { useTranslation } from '@/i18n'
import { formatLongDate } from '@/utils/formatLongDate'

type OperationSheetProps = {
  operation: MapOperation
  language: Language
  onClose: () => void
}

// Les éléments qui prennent le focus dans la fiche, pour y garder la tabulation.
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatPosition(operation: MapOperation, language: Language): string | null {
  const { latitude, longitude } = operation
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null

  const coordinate = (value: number) =>
    Math.abs(value).toLocaleString(language, { maximumFractionDigits: 3 })
  const northSouth = latitude >= 0 ? 'N' : 'S'
  const eastWest = longitude >= 0 ? 'E' : 'W'
  return `${coordinate(latitude)}° ${northSouth}, ${coordinate(longitude)}° ${eastWest}`
}

// La fiche d'une opération, affichée comme une fenêtre modale par-dessus la carte.
export function OperationSheet({ operation, language, onClose }: OperationSheetProps) {
  const t = useTranslation()
  const unknown = t('operation.unknown')
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Le focus revient au point de la carte à la fermeture, sinon le clavier repart du début.
    const previous = document.activeElement
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [onClose])

  const date = formatLongDate(operation.date, language)
  const position = formatPosition(operation, language) ?? unknown
  const port = operation.port_disembarkation ? operation.port_disembarkation : unknown
  const survivors =
    typeof operation.nb_survivor === 'number'
      ? operation.nb_survivor.toLocaleString(language)
      : unknown

  return (
    <div className="ra-modal__overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="operation-title"
        className="ra-modal__dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="operation-title">{t('operation.ficheTitle', { date })}</h2>
        <dl>
          <dt>{t('operation.date')}</dt>
          <dd>{date}</dd>
          <dt>{t('operation.position')}</dt>
          <dd>{position}</dd>
          <dt>{t('operation.port')}</dt>
          <dd>{port}</dd>
          <dt>{t('operation.peopleRescued')}</dt>
          <dd>{survivors}</dd>
        </dl>
        <button ref={closeButtonRef} type="button" className="ra-modal__close" onClick={onClose}>
          {t('operation.close')}
        </button>
      </div>
    </div>
  )
}
