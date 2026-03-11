import { Interpolation, Theme } from '@emotion/react'
import { DisplayedAction } from '@gamepark/react-client'
import { MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { ComponentType } from 'react'

export type MaterialLogProps<Move extends MaterialMove = MaterialMove, P extends number = number, M extends number = number, L extends number = number, R extends number = number, V extends number = number> = MoveComponentProps<Move, P, MaterialGame<P, M, L, R, V>>

export type MoveComponentProps<Move = any, Player = number, Game = any> = {
  move: Move,
  context: MoveComponentContext<Move, Player, Game>
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
  css?: Interpolation<Theme>
  liveCss?: boolean
}

export interface LogDescription<Move = any, Player = number, Game = any> {
  getMovePlayedLogDescription(move: Move, context: MoveComponentContext<Move, Player, Game>): MovePlayedLogDescription | undefined
}
