import { useTranslation } from '@/i18n'

export function NotFound() {
  const t = useTranslation()

  return (
    <main>
      <h1>{t('notFound.title')}</h1>
    </main>
  )
}
