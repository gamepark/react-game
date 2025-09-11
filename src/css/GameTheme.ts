import { Interpolation } from '@emotion/react'
import { addStylesheetUrl } from './addStylesheetUrl'

addStylesheetUrl('https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap')

export interface GameTheme {
  root: RootTheme
  dialog: DialogTheme
  buttons?: Interpolation<GameTheme>,
  dropArea?: DropAreaTheme
}

export interface DropAreaTheme {
  backgroundColor: string
}

export interface RootTheme {
  fontFamily: string
  background: BackgroundTheme
}

export interface BackgroundTheme {
  image: string
  overlay: string
}

export interface DialogTheme {
  backgroundColor: string
  color: string
}

export const defaultTheme: GameTheme = {
  root: {
    fontFamily: 'Mulish',
    background: {
      image: '/cover-1920.jpg',
      overlay: 'rgba(0, 0, 0, 0.8)'
    }
  },
  dialog: {
    backgroundColor: '#f0fbfc',
    color: '#002448'
  },
  dropArea: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)'
  }
}
