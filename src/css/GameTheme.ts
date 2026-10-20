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
  extensionDialog?: ExtensionDialogTheme
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
  /**
   * The row that lays out a help dialog: the item (or location) display on one side, the help text ({@link content})
   * on the other. Lets a game change the default padding and gap, for instance to draw the two parts as the pages of
   * a book.
   */
  helpLayout?: Interpolation<GameTheme>
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
  /**
   * The buttons of the message dialogs that call for care (give up, eject a player). Applied after
   * {@link buttons}, so a game can keep its button recipe and only change what tells the danger.
   */
  dangerButtons?: Interpolation<GameTheme>
  /** The title (h2) of the message dialogs of the framework: give up, full screen, bug report, failures… */
  title?: Interpolation<GameTheme>
  /** The paragraphs of the message dialogs of the framework */
  text?: Interpolation<GameTheme>
  /** The fields of the message dialogs of the framework (the textarea and select of the bug report) */
  fields?: Interpolation<GameTheme>
  /**
   * The container of the message dialogs of the framework (give up, eject, full screen, bug report, player quit,
   * failures, time stats), applied after {@link container}: they are small and carry their content directly, so a
   * game can give them their own size and padding.
   */
  message?: Interpolation<GameTheme>
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
  /** The side panel of the journal, applied after {@link MenuTheme.panel} (both panels share it) */
  panel?: Interpolation<GameTheme>
  tab?: Interpolation<GameTheme>
  tabSelected?: Interpolation<GameTheme>
  /** The bar at the bottom of the chat where a message is typed: the form holding the input and the send button */
  chatBar?: Interpolation<GameTheme>
  /**
   * Style of one history entry. Any "font-size" here is relative to the default entry size:
   * "1em" keeps the standard size, "1.05em" makes the text 5% bigger.
   */
  historyEntry?: Interpolation<GameTheme>
}

export interface ResultTheme {
  border?: string
  icon?: string
  container?: Interpolation<GameTheme>
  closeIcon?: Interpolation<GameTheme>
  /** The column inside the result dialog that holds the parts below (the dialog's {@link DialogTheme.content} applies too) */
  content?: Interpolation<GameTheme>
  /** The title of the result: who wins ({@link ScoringDescription.ResultDialogHeader} or the result text) */
  header?: Interpolation<GameTheme>
  /** The line of navigation buttons (back to Game Park, play again, ranking) */
  buttons?: Interpolation<GameTheme>
  /** The scoring table: players as columns, scoring keys as rows */
  table?: Interpolation<GameTheme>
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

export interface ExtensionDialogTheme {
  container?: Interpolation<GameTheme>
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
