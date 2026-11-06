import type { CSSProperties } from 'react'
import { pictos } from './pictos'

type PictoProps = {
  /** nom du fichier dans assets/pictos, par exemple "lifebuoy" */
  name: string
  /** texte lu par les lecteurs d'écran ; sans lui, le picto est décoratif */
  label?: string
  /** taille CSS, 1.5em par défaut ; la couleur est celle du texte */
  size?: string
}

export function Picto({ name, label, size }: PictoProps) {
  // hasOwn : un nom comme « toString » ne doit pas tomber sur une méthode d'objet.
  const url = Object.hasOwn(pictos, name) ? pictos[name] : undefined
  if (!url) {
    if (import.meta.env.DEV) console.warn(`Picto inconnu : ${name}`)
    return null
  }
  const style: CSSProperties = { '--ra-masque': `url("${url}")`, '--ra-picto-taille': size }
  return label ? (
    <span role="img" aria-label={label} className="ra-picto" style={style} />
  ) : (
    <span aria-hidden="true" className="ra-picto" style={style} />
  )
}
