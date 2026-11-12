import type { CSSProperties } from 'react'
import { icons } from './icons'

type IconProps = {
  /** nom du fichier dans assets/icons, par exemple "lifebuoy" */
  name: string
  /** texte lu par les lecteurs d'écran ; sans lui, le picto est décoratif */
  label?: string
  /** taille CSS, 1.5em par défaut ; la couleur est celle du texte */
  size?: string
}

// Un picto de la charte de SOS MEDITERRANEE.
export function Icon({ name, label, size }: IconProps) {
  // hasOwn : un nom comme « toString » ne doit pas tomber sur une méthode d'objet.
  const url = Object.hasOwn(icons, name) ? icons[name] : undefined
  if (!url) {
    if (import.meta.env.DEV) console.warn(`Unknown icon: ${name}`)
    return null
  }
  const style: CSSProperties = { '--ra-mask': `url("${url}")`, '--ra-icon-size': size }
  return label ? (
    <span role="img" aria-label={label} className="ra-icon" style={style} />
  ) : (
    <span aria-hidden="true" className="ra-icon" style={style} />
  )
}
