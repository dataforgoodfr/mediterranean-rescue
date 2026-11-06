import type { CSSProperties } from 'react'

type LogoProps = {
  /** bleu marine (par défaut) sur fond clair, blanc sur fond sombre */
  variant?: 'color' | 'white'
  /** hauteur CSS ; jamais sous le minimum de la charte (--logo-min-height) */
  height?: string
}

// Le logo de SOS MEDITERRANEE. Règles d'usage : docs/design-system.md (ni rotation,
// ni autre couleur, ni contour, ni déformation).
export function Logo({ variant = 'color', height }: LogoProps) {
  const style: CSSProperties | undefined = height ? { '--ra-logo-height': height } : undefined
  return (
    <span
      role="img"
      aria-label="SOS MEDITERRANEE"
      className={variant === 'white' ? 'ra-logo ra-logo--white' : 'ra-logo'}
      style={style}
    />
  )
}
