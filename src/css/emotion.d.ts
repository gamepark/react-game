import '@emotion/react'
import { GameTheme } from './GameTheme'

declare module '@emotion/react' {
  export interface Theme extends GameTheme {
  }
}
