import '@emotion/react'
import { Interpolation } from '@emotion/react'

declare module '@emotion/react' {
  export interface Theme {
    buttons?: Interpolation<Theme>
  }
}