import { Interpolation, Theme } from '@emotion/react'
import { DisplayedAction } from '@gamepark/react-client'
import { ComponentType } from 'react'

export type MoveComponentProps<Move = any, Player = number> = {
  move: Move,
  context: MoveComponentContext<Move, Player>
}

export type MoveComponentContext<Move = any, Player = number, Game = any> = {
  game: Game
  action: DisplayedAction<Move, Player>,
  consequenceIndex?: number,
}

export type MovePlayedLogDescription<Move = any, Player = number> = {
  Component: ComponentType<MoveComponentProps<Move, Player>>,
  player?: Player;
  depth?: number;
  extraCss?: Interpolation<Theme>
}

export interface LogDescription<Move = any, Player = number, Game = any> {
  disableLiveCustomCss?: boolean
  getMovePlayedLogDescription(move: Move, context: MoveComponentContext<Move, Player, Game>): MovePlayedLogDescription | undefined
}
