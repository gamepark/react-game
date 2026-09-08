import { DisplayedAction, PlayedMove } from '@gamepark/react-client'
import { Rules } from '@gamepark/rules-api'
import { findLastIndex } from 'es-toolkit/compat'
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

export type RewindPlan = {
  /** Index of the first move that no longer matches the ones already processed (the first undone move). */
  firstIndexChange: number
  /** Index, in the current history, of the last entry that survives the rewind (-1 when none does). */
  lastValidHistoryIndex: number
  /** Index of the first move whose history entry must be rebuilt. Every move before it is replayed on the engine. */
  newMovesStart: number
  /** Checkpoints that are still usable, i.e. taken at or before `newMovesStart`. */
  validCheckpoints: Checkpoint[]
  /** Game state the engine must restart from, and the move index it corresponds to. */
  restartState: any
  restartIndex: number
}

/**
 * Computes how far back the engine must be rewound when moves are removed (undo).
 *
 * The engine has to be positioned exactly on `newMovesStart`, the first move whose history entry must be
 * rebuilt: every move before it is replayed once, and `processMovesSync` plays the remaining ones. A move
 * played twice would run its rule consequences twice (`onRuleEnd`, memory updates, ...) and silently corrupt
 * both the game state and every log entry computed from it afterwards.
 */
export const computeRewindPlan = (
  processedMoves: PlayedMove[],
  playedMoves: PlayedMove[],
  history: MoveHistory[],
  checkpoints: Checkpoint[],
  setup: any
): RewindPlan => {
  const firstIndexChange = processedMoves.findIndex((processedMove, index) => processedMove.actionId !== playedMoves[index]?.actionId)
  const invalidatedMoves = processedMoves.slice(firstIndexChange)
  const lastValidHistoryIndex = findLastIndex(history, (moveHistory) => !invalidatedMoves.some((move) => move.actionId === moveHistory.action.id))
  const lastValidHistory = lastValidHistoryIndex !== -1 ? history[lastValidHistoryIndex] : undefined

  // Entries after the last valid one must be rebuilt, so we rewind to the move right after it. It always sits
  // before `firstIndexChange`, since a history entry of an undone move cannot be valid.
  const lastValidMoveIndex = lastValidHistory
    ? findLastIndex(playedMoves, (move) =>
      move.actionId === lastValidHistory.action.id && move.consequenceIndex === lastValidHistory.consequenceIndex
    )
    : -1
  const newMovesStart = lastValidMoveIndex !== -1 ? lastValidMoveIndex + 1 : firstIndexChange

  const validCheckpoints = checkpoints.filter((cp) => cp.moveIndex <= newMovesStart)
  const nearestCheckpoint = validCheckpoints.length > 0 ? validCheckpoints[validCheckpoints.length - 1] : undefined

  return {
    firstIndexChange,
    lastValidHistoryIndex,
    newMovesStart,
    validCheckpoints,
    restartState: nearestCheckpoint ? nearestCheckpoint.gameState : setup,
    restartIndex: nearestCheckpoint ? nearestCheckpoint.moveIndex : 0
  }
}

/**
 * Rebuilds the engine at `plan.newMovesStart`, from the nearest usable checkpoint (or the setup).
 */
export const rewindEngine = (
  engine: HistoryEngine,
  plan: RewindPlan,
  playedMoves: PlayedMove[],
  ctx: LogContext
) => {
  engine.checkpoints = plan.validCheckpoints
  engine.rules = new ctx.RulesClass(JSON.parse(JSON.stringify(plan.restartState)), ctx.gameOver ? undefined : { player: ctx.player })
  for (let i = plan.restartIndex; i < plan.newMovesStart; i++) {
    playMoveOnEngine(engine, playedMoves[i], ctx.getAction)
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
