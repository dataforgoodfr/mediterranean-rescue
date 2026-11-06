import type { CSSProperties } from 'react'

type LogoProps = {
  /** bleu marine (par défaut) sur fond clair, blanc sur fond sombre */
  variant?: 'couleur' | 'blanc'
  /** hauteur CSS ; jamais sous le minimum de la charte (--logo-hauteur-min) */
  height?: string
}

// Le logo de SOS MEDITERRANEE. Règles d'usage : docs/design-system.md (ni rotation,
// ni autre couleur, ni contour, ni déformation).
export function Logo({ variant = 'couleur', height }: LogoProps) {
  const style: CSSProperties | undefined = height ? { '--ra-logo-hauteur': height } : undefined
  return (
    <span
      role="img"
      aria-label="SOS MEDITERRANEE"
      className={variant === 'blanc' ? 'ra-logo ra-logo--blanc' : 'ra-logo'}
      style={style}
    />
  )
}
