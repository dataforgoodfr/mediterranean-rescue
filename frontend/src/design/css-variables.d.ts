// Les variables CSS que les composants passent dans `style`. React ne les connaît pas : on les
// ajoute à son type, plutôt que de forcer le type avec `as`.
// https://react.dev/reference/react-dom/components/common#applying-css-styles
import 'react'

declare module 'react' {
  interface CSSProperties {
    '--ra-mask'?: string
    '--ra-icon-size'?: string
    '--ra-logo-height'?: string
  }
}
