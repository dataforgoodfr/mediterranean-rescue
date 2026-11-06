# Le design system

Une base commune pour que les écrans se ressemblent, sans brider les idées. Elle vient de la
charte graphique de SOS MEDITERRANEE. Le code est dans `frontend/src/design/`.

## Ce qui est fixé

**Les couleurs**, en variables CSS dans `design/tokens.css` :

| Variable | Couleur | Pour |
|---|---|---|
| `--color-primary` | `#1a2747` bleu marine | texte fort, titres longs, fonds sombres, logo |
| `--color-secondary` | `#f03e1b` orange | titres, accents, pictos (par `color`) |
| `--color-text` | `#3c3c3b` gris 90 % | texte courant, intertitres |
| `--color-surface` | `#e3e2e9` bleu à 10 % | fonds de blocs (classe `ra-block`) |

L'orange n'a pas le contraste suffisant pour du texte courant (3,9:1 sur blanc) : seulement
pour les grands titres (24 px ou plus), les pictos et les accents. Sur le fond de bloc, il
atteint tout juste 3:1 : grands titres seulement.

**La police** : Raleway, déjà chargée. Titres en gras et en majuscules, en orange (en bleu pour
un titre long) ; intertitres en semi-gras ; texte en regular, en gris.

**Le logo** : `<Logo />`, en bleu marine, ou `<Logo variant="white" />` sur un fond sombre. Pas
de rotation, pas d'autre couleur, pas de contour, pas de déformation. Il garde sa taille
minimale et l'espace sous lui ; laisse aussi de la place sur les côtés (la largeur d'un « E »
du logo, comme le demande la charte).

**Le nom** : « SOS MEDITERRANEE » s'écrit toujours en majuscules, sans accent.

**L'accessibilité** : contraste AA, focus visible, un texte pour chaque picto qui porte un sens.

## Ce qui est libre

La mise en page, le style de la carte (fonds MapLibre, points, zones), les composants, les
animations, les illustrations. Tout ce qui lit les variables plutôt que des valeurs en dur reste
cohérent. Une idée qui change l'allure du site ? Montre-la dans la pull request avec une capture.

## Utiliser

```tsx
import { Icon, Logo } from './design'

<Logo />
<Icon name="lifebuoy" />                                {/* décoratif */}
<Icon name="anchor" label="Port de débarquement" />     {/* lu par les lecteurs d'écran */}
```

```css
.ma-carte-legende {
  color: var(--color-primary);
  padding: var(--space-2);
}
```

Un picto prend la couleur du texte autour de lui : `color: var(--color-secondary)` le passe
en orange. Les 53 pictos sont dans `frontend/src/assets/icons/`, nommés en anglais (`lifebuoy`,
`anchor`, `person-in-water`…).

## D'où viennent les fichiers

La charte graphique simplifiée de SOS MEDITERRANEE (2024, couleurs de décembre 2019). Le logo
vient de son PDF vectoriel.
Les pictos ont été vectorisés à partir de la planche de la charte : si les SVG d'origine
arrivent, ils remplacent ces fichiers sous le même nom.
