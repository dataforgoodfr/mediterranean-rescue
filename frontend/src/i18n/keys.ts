// Tous les textes affichés par l'app, une clé par texte, avec une note pour qui traduit.
// Un texte nouveau : une clé ici, puis sa traduction dans les langues que tu maîtrises.
// Règles et étiquette à poser quand une langue manque : CONTRIBUTING.md (« Les langues »).
export const keys = {
  'home.title': "Le titre de la page d'accueil, le nom du projet",
  'home.intro': "La phrase sous le titre, tant que la carte n'est pas là",
  'home.apiStatus': "L'état de l'API ; {status} est remplacé par l'un des trois textes suivants",
  'home.apiStatus.pending': "L'API n'a pas encore répondu",
  'home.apiStatus.unreachable': "L'API ne répond pas ou renvoie une erreur",
  'home.apiStatus.ok': "L'API répond",
}

export type MessageKey = keyof typeof keys

// Une langue peut ne pas avoir toutes les clés : la traduction n'est jamais obligatoire.
export type Translations = Partial<Record<MessageKey, string>>
