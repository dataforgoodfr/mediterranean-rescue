import { Icon, icons, Logo } from '../design'
import { useTranslation } from '../i18n'
import type { MessageKey } from '../i18n/keys'
import './Design.css'

// Les couleurs de la charte (design/tokens.css), avec leur usage. La valeur vient de la variable :
// la page ne répète aucune couleur en dur.
const colors: { token: string; usage: MessageKey }[] = [
  { token: '--color-primary', usage: 'design.colors.primary' },
  { token: '--color-secondary', usage: 'design.colors.secondary' },
  { token: '--color-text', usage: 'design.colors.text' },
  { token: '--color-surface', usage: 'design.colors.surface' },
]

// Le design system en une page, pour reprendre les couleurs, le logo et les pictos sans chercher.
// Règles d'usage : docs/design-system.md
export function Design() {
  const t = useTranslation()
  const iconNames = Object.keys(icons).sort()

  return (
    <main className="ra-design">
      <h1>{t('design.title')}</h1>
      <p>{t('design.intro')}</p>

      <h2>{t('design.colors')}</h2>
      <ul className="ra-design__grid">
        {colors.map(({ token, usage }) => (
          <li key={token} className="ra-design__color">
            <span className="ra-design__swatch" style={{ background: `var(${token})` }} />
            <code>{token}</code>
            <span>{t(usage)}</span>
          </li>
        ))}
      </ul>

      <h2>{t('design.logo')}</h2>
      <div className="ra-design__logos">
        <figure>
          <Logo />
          <figcaption>{t('design.logo.color')}</figcaption>
        </figure>
        <figure>
          <div className="ra-design__dark">
            <Logo variant="white" />
          </div>
          <figcaption>{t('design.logo.white')}</figcaption>
        </figure>
      </div>

      <h2>{t('design.icons', { count: String(iconNames.length) })}</h2>
      <p>{t('design.icons.usage')}</p>
      <ul className="ra-design__grid">
        {iconNames.map((name) => (
          <li key={name} className="ra-design__icon">
            <Icon name={name} label={name} size="var(--space-3)" />
            <code aria-hidden="true">{name}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
