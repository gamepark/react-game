import { Interpolation } from '@emotion/react'
import { ComponentType } from 'react'
import { addStylesheetUrl } from './addStylesheetUrl'

addStylesheetUrl('https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap')

export interface GameTheme {
  root: RootTheme
  dialog: DialogTheme
  buttons?: Interpolation<GameTheme>
  dropArea?: DropAreaTheme
  palette: PaletteTheme
  menu?: MenuTheme
  journal?: JournalTheme
  result?: ResultTheme
  header?: HeaderTheme
  playerPanel?: PlayerPanelTheme
  tutorial?: TutorialTheme
  timeStats?: TimeStatsTheme
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

export type DialogNavigationProps = {
  onPrevious?: () => void
  onNext?: () => void
  currentIndex: number
  total: number
}

export interface DialogTheme {
  backgroundColor: string
  color: string
  container?: Interpolation<GameTheme>
  backdrop?: Interpolation<GameTheme>
  closeIcon?: Interpolation<GameTheme>
  closeButton?: ComponentType<{ onClick: () => void }>
  content?: Interpolation<GameTheme>
  openAnimation?: Interpolation<GameTheme>
  closeAnimation?: Interpolation<GameTheme>
  navigation?: ComponentType<DialogNavigationProps>
  navigationCss?: Interpolation<GameTheme>
  /**
   * Optional override applied to every <button> rendered inside a
   * Dialog (rules / help / confirmation / tutorial). When defined,
   * shadows theme.buttons for the dialog subtree, so games can have
   * a different button look in dialogs than on the rest of the UI.
   * Falls back to theme.buttons when undefined.
   */
  buttons?: Interpolation<GameTheme>
}

export interface PaletteTheme {
  primary: string
  primaryHover: string
  primaryActive: string
  primaryLight: string
  primaryLighter: string
  surface: string
  onSurface: string
  onSurfaceFocus: string
  onSurfaceActive: string
  danger: string
  dangerHover: string
  dangerActive: string
  disabled: string
}

export interface MenuTheme {
  panel?: Interpolation<GameTheme>
  button?: Interpolation<GameTheme>
  mainButton?: Interpolation<GameTheme>
  popButton?: Interpolation<GameTheme>
}

export interface JournalTheme {
  tab?: Interpolation<GameTheme>
  tabSelected?: Interpolation<GameTheme>
  chatBar?: Interpolation<GameTheme>
  historyEntry?: Interpolation<GameTheme>
}

export interface ResultTheme {
  border?: string
  icon?: string
  container?: Interpolation<GameTheme>
  closeIcon?: Interpolation<GameTheme>
}

export interface HeaderTheme {
  bar?: Interpolation<GameTheme>
  buttons?: Interpolation<GameTheme>
}

export interface PlayerPanelTheme {
  activeRingColors?: [string, string]
  panel?: Interpolation<GameTheme>
  dataBadge?: Interpolation<GameTheme>
}

export interface TutorialTheme {
  container?: Interpolation<GameTheme>
  content?: Interpolation<GameTheme>
}

export interface TimeStatsTheme {
  container?: Interpolation<GameTheme>
  thinkBackground?: string
  waitBackground?: string
}

export const defaultPalette: PaletteTheme = {
  primary: '#28B8CE',
  primaryHover: '#24a5b9',
  primaryActive: '#2092a3',
  primaryLight: '#f0fbfc',
  primaryLighter: '#dbf5f8',
  surface: '#F0FBFC',
  onSurface: '#002448',
  onSurfaceFocus: '#c2ebf1',
  onSurfaceActive: '#ade4ec',
  danger: 'darkred',
  dangerHover: '#ffd7d7',
  dangerActive: '#ffbebe',
  disabled: '#555555'
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
  },
  // theme.buttons is intentionally left undefined: each consumer
  // (Header, Dialog, ...) layers its own structural defaults below
  // the game override, so a missing theme.buttons must NOT spread a
  // generic recipe everywhere.
  palette: defaultPalette
}
