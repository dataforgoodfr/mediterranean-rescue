import type { Translations } from './keys.ts'

export const fr: Translations = {
  'home.title': 'Rescue Atlas',
  'home.intro': 'La carte des opérations de sauvetage de SOS MEDITERRANEE arrive bientôt.',
  'home.apiStatus': 'API : {status}',
  'home.apiStatus.pending': 'en attente',
  'home.apiStatus.unreachable': 'injoignable',
  'home.apiStatus.ok': 'ok',
  'design.title': 'Design system',
  'design.intro':
    'Les couleurs, le logo et les pictos de la charte de SOS MEDITERRANEE, prêts à reprendre.',
  'design.colors': 'Couleurs',
  'design.colors.primary': 'Bleu marine : texte fort, titres longs, fonds sombres, logo',
  'design.colors.secondary': 'Orange : titres, accents, pictos. Pas pour le texte courant',
  'design.colors.text': 'Gris : texte courant, intertitres',
  'design.colors.surface': 'Bleu clair : fonds de blocs',
  'design.logo': 'Logo',
  'design.logo.color': 'Bleu marine, sur fond clair',
  'design.logo.white': 'Blanc, sur fond sombre uniquement',
  'design.icons': 'Pictos ({count})',
  'design.icons.usage': "Un picto prend la couleur du texte autour de lui. Dans le code, utilise son nom.",
}
