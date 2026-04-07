import { DisplayedAction, PlayedMove } from '@gamepark/react-client'
import { Rules } from '@gamepark/rules-api'
import { MovePlayedLogDescription } from '../components'
import { MoveHistory } from './useFlatHistory'

export const CHECKPOINT_INTERVAL = 50

export type Checkpoint = {
  moveIndex: number
  gameState: any
}

export type HistoryEngine = {
  rules: Rules
  checkpoints: Checkpoint[]
  movesProcessed: number
}

/**
 * Replays moves from the nearest checkpoint to produce the game state at a given move index.
 */
export const replayFromCheckpoint = (
  targetMoveIndex: number,
  checkpoints: Checkpoint[],
  allPlayedMoves: PlayedMove[],
  RulesClass: new (game: any, options?: any) => Rules,
  setup: any,
  gameOver: boolean | undefined,
  player: any,
  getAction: (actionId: string) => DisplayedAction | undefined
): any => {
  let nearest: Checkpoint | undefined
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (checkpoints[i].moveIndex <= targetMoveIndex) {
      nearest = checkpoints[i]
      break
    }
  }

  const startState = nearest ? nearest.gameState : setup
  const startIndex = nearest ? nearest.moveIndex : 0
  const tempRules = new RulesClass(JSON.parse(JSON.stringify(startState)), gameOver ? undefined : { player })

  for (let i = startIndex; i < targetMoveIndex; i++) {
    try {
      const action = getAction(allPlayedMoves[i].actionId)
      tempRules.play(JSON.parse(JSON.stringify(allPlayedMoves[i].move)), { local: action?.local })
    } catch (error) {
      console.error('Error replaying move for lazy game state', error)
    }
  }

  return JSON.parse(JSON.stringify(tempRules.game))
}

export const saveCheckpointIfNeeded = (engine: HistoryEngine, moveIndex: number) => {
  if (moveIndex > 0 && moveIndex % CHECKPOINT_INTERVAL === 0) {
    engine.checkpoints.push({
      moveIndex,
      gameState: JSON.parse(JSON.stringify(engine.rules.game))
    })
  }
}

export const playMoveOnEngine = (
  engine: HistoryEngine,
  move: PlayedMove,
  getAction: (actionId: string) => DisplayedAction | undefined
) => {
  try {
    const action = getAction(move.actionId)
    engine.rules.play(JSON.parse(JSON.stringify(move.move)), { local: action?.local })
  } catch (error) {
    console.error('Error while playing a move in useFlatHistory', engine.rules.game, move, error)
  }
}

export const buildActionMap = (actions: DisplayedAction[] | undefined): Map<string, DisplayedAction> => {
  const map = new Map<string, DisplayedAction>()
  if (actions) {
    for (const action of actions) {
      if (action.id) map.set(action.id, action)
    }
  }
  return map
}

export type LogContext = {
  logs?: {
    getMovePlayedLogDescription(move: any, context: any): MovePlayedLogDescription | undefined
  }
  RulesClass: new (game: any, options?: any) => Rules
  setup: any
  gameOver: boolean | undefined
  player: any
  getAction: (actionId: string) => DisplayedAction | undefined
}

export const getMoveEntry = (
  playedMove: PlayedMove,
  moveIndex: number,
  engine: HistoryEngine,
  allPlayedMoves: PlayedMove[],
  ctx: LogContext
): MoveHistory | undefined => {
  const { move, consequenceIndex } = playedMove
  const action = ctx.getAction(playedMove.actionId)
  if (!action) return undefined

  let cachedGame: any = undefined
  const moveComponentContext = {
    move, consequenceIndex, action,
    get game() {
      if (cachedGame === undefined) {
        cachedGame = JSON.parse(JSON.stringify(engine.rules.game))
      }
      return cachedGame
    }
  }

  const description = ctx.logs?.getMovePlayedLogDescription(move, moveComponentContext)
  if (!description?.Component) return

  const capturedMoveIndex = moveIndex
  const capturedCheckpoints = [...engine.checkpoints]
  return {
    ...description, move, consequenceIndex, action,
    get game() {
      if (cachedGame === undefined) {
        cachedGame = replayFromCheckpoint(
          capturedMoveIndex, capturedCheckpoints, allPlayedMoves,
          ctx.RulesClass, ctx.setup, ctx.gameOver, ctx.player, ctx.getAction
        )
      }
      return cachedGame
    }
  }
}

/**
 * Processes a list of moves synchronously, returning history entries.
 * This is the core logic extracted from the hook for testability.
 */
export const processMovesSync = (
  moves: PlayedMove[],
  startIndex: number,
  engine: HistoryEngine,
  allPlayedMoves: PlayedMove[],
  ctx: LogContext
): MoveHistory[] => {
  const entries: MoveHistory[] = []
  let moveIndex = startIndex
  for (const move of moves) {
    const entry = getMoveEntry(move, moveIndex, engine, allPlayedMoves, ctx)
    if (entry) entries.push(entry)
    playMoveOnEngine(engine, move, ctx.getAction)
    saveCheckpointIfNeeded(engine, moveIndex + 1)
    moveIndex++
  }
  return entries
}
