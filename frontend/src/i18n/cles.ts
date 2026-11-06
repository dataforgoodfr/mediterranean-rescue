// Tous les textes affichés par l'app, une clé par texte, avec une note pour qui traduit.
// Un texte nouveau : une clé ici, puis sa traduction dans les langues que tu maîtrises.
// Règles et étiquette à poser quand une langue manque : CONTRIBUTING.md (« Les langues »).
export const cles = {
  'accueil.titre': "Le titre de la page d'accueil, le nom du projet",
  'accueil.intro': "La phrase sous le titre, tant que la carte n'est pas là",
  'accueil.api': "L'état de l'API ; {etat} est remplacé par l'un des trois textes suivants",
  'accueil.api.attente': "L'API n'a pas encore répondu",
  'accueil.api.injoignable': "L'API ne répond pas ou renvoie une erreur",
  'accueil.api.ok': "L'API répond",
}

export type Cle = keyof typeof cles

// Une langue peut ne pas avoir toutes les clés : la traduction n'est jamais obligatoire.
export type Traductions = Partial<Record<Cle, string>>
