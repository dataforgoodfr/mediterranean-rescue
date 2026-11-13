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
  'design.title': 'Design system',
  'design.intro':
    'The colours, logo and icons of the SOS MEDITERRANEE brand guidelines, ready to reuse.',
  'design.colors': 'Colours',
  'design.colors.primary': 'Navy blue: strong text, long titles, dark backgrounds, logo',
  'design.colors.secondary': 'Orange: titles, accents, icons. Not for body text',
  'design.colors.text': 'Grey: body text, subheadings',
  'design.colors.surface': 'Light blue: block backgrounds',
  'design.logo': 'Logo',
  'design.logo.color': 'Navy blue, on a light background',
  'design.logo.white': 'White, on a dark background only',
  'design.icons': 'Icons ({count})',
  'design.icons.usage': 'An icon takes the colour of the text around it. In the code, use its name.',
}
