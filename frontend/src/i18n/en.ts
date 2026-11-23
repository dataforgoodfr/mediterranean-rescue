import type { Translations } from './keys.ts'

// L'anglais, la langue principale de la carte : c'est elle qui s'affiche quand une
// traduction manque.
export const en: Translations = {
  'home.title': 'Rescue Atlas',
  'home.intro':
    "SOS MEDITERRANEE's rescues in the central Mediterranean. The operations will soon appear on the map.",
  'home.apiStatus': 'API: {status}',
  'home.apiStatus.pending': 'waiting',
  'home.apiStatus.unreachable': 'unreachable',
  'home.apiStatus.ok': 'ok',
  'home.lastOperationDate': 'Last operation: {date}',
  'map.label': 'Map of the central Mediterranean',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.attribution': 'Show the sources of the data displayed',
  'map.unavailable':
    'This browser cannot display the map. Try an up-to-date browser, or turn on hardware acceleration.',
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
  'design.icons.usage':
    'An icon takes the colour of the text around it. In the code, use its name.',
  'notFound.title': 'Page not found',
}
