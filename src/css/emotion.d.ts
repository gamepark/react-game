import '@emotion/react'
import { Interpolation } from '@emotion/react'

declare module '@emotion/react' {
  export interface Theme {
    light?: boolean
    toggleContrast?: () => void
    buttons?: Interpolation<Theme>
  }
}