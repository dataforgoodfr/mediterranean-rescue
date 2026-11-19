import type { Translations } from './keys.ts'

export const fr: Translations = {
  'home.title': 'Rescue Atlas',
  'home.intro':
    'Les sauvetages de SOS MEDITERRANEE en Méditerranée centrale. Les opérations arrivent bientôt sur la carte.',
  'home.apiStatus': 'API : {status}',
  'home.apiStatus.pending': 'en attente',
  'home.apiStatus.unreachable': 'injoignable',
  'home.apiStatus.ok': 'ok',
  'map.label': 'Carte de la Méditerranée centrale',
  'map.zoomIn': 'Zoomer',
  'map.zoomOut': 'Dézoomer',
  'map.attribution': 'Afficher les sources de la carte',
  'map.unavailable':
    "Ce navigateur ne peut pas afficher la carte. Essaie avec un navigateur à jour, ou active l'accélération graphique.",
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
