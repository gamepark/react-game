import { DisplayedAction } from '@gamepark/react-client'
import { MaterialMove } from '@gamepark/rules-api'


export type MaterialHistoryProps<Game = any, Move = any, PlayerId = number> = {
  move: MaterialMove
  context: HistoryEntryContext<Game, Move, PlayerId>
}

export type HistoryEntryContext<Game = any, Move = any, PlayerId = number> = {
  action: DisplayedAction<Move, PlayerId>;
  consequenceIndex?: number;
  game: Game;
}