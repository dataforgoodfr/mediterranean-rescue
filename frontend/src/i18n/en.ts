import type { Translations } from './keys.ts'

// L'anglais, la langue principale de la carte : c'est elle qui s'affiche quand une
// traduction manque.
export const en: Translations = {
  'home.title': 'Rescue Atlas',
  'home.intro': 'The map of SOS MEDITERRANEE rescue operations is coming soon.',
  'home.apiStatus': 'API: {status}',
  'home.apiStatus.pending': 'waiting',
  'home.apiStatus.unreachable': 'unreachable',
  'home.apiStatus.ok': 'ok',
}
