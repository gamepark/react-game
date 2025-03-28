import { DisplayedAction } from '@gamepark/react-client'


export type MaterialHistoryProps<Game = any, Move = any, PlayerId = number> = {
  move: Move
  context: HistoryEntryContext<Game, Move, PlayerId>
}

export type HistoryEntryContext<Game = any, Move = any, PlayerId = number> = {
  action: DisplayedAction<Move, PlayerId>;
  consequenceIndex?: number;
  game?: Game;
}
