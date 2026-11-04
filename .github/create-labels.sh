#!/bin/sh
# Crée les étiquettes du projet. À lancer une fois, par un tech lead,
# depuis la racine du dépôt : sh .github/create-labels.sh
# Il faut l'outil `gh` connecté (https://cli.github.com). --force met à jour une étiquette
# qui existe déjà. L'avancement se suit dans les colonnes du projet, pas par étiquette.
# Couleurs : violet pour débuter, verts pour les niveaux, rouge et orange pour ce qui bloque,
# bleu, sarcelle, ocre, gris et bleu pâle pour les zones.
set -e
gh label create "good first issue" --color 7057FF --description "Première contribution : petite, guidée, sans prérequis" --force
gh label create "niveau-2" --color A2D9A5 --description "Intermédiaire" --force
gh label create "niveau-3" --color 2DA44E --description "Confirmé" --force
gh label create "bloquée" --color B60205 --description "Attend une réponse" --force
gh label create "front" --color 1D76DB --description "La carte" --force
gh label create "back" --color 0E7C86 --description "L'API et la base" --force
gh label create "data" --color C69026 --description "Sources et données" --force
gh label create "docs" --color 8B949E --description "Documentation" --force
gh label create "ci" --color BFD4F2 --description "CI et outillage" --force
gh label create "bug" --color D93F0B --description "Quelque chose ne marche pas" --force
