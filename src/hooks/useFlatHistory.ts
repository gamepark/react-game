import { DisplayedAction, PlayedMove, useGameSelector } from '@gamepark/react-client'
import { MaterialMove } from '@gamepark/rules-api'
import { findLastIndex } from 'es-toolkit/compat'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { gameContext, MovePlayedLogDescription } from '../components'
import {
  buildActionMap,
  getMoveEntry,
  HistoryEngine,
  playMoveOnEngine,
  processMovesSync,
  saveCheckpointIfNeeded
} from './flatHistoryEngine'
import { usePlayerId } from './usePlayerId'

const BATCH_TIME_BUDGET_MS = 8 // stay under 1 frame (16ms), leave room for rendering

export type MoveHistory<Move = any, Player = any, Game = any> = MovePlayedLogDescription<Move, Player> & {
  action: DisplayedAction<Move, Player>
  move: MaterialMove
  game: Game
  consequenceIndex?: number
}

// Polyfill for Safari
const scheduleIdle = typeof requestIdleCallback === 'function'
  ? requestIdleCallback
  : (cb: (deadline: { timeRemaining: () => number }) => void) =>
    setTimeout(() => cb({ timeRemaining: () => BATCH_TIME_BUDGET_MS }), 1) as unknown as number

const cancelIdle = typeof cancelIdleCallback === 'function'
  ? cancelIdleCallback
  : (id: number) => clearTimeout(id)

export const useFlatHistory = () => {
  const context = useContext(gameContext)
  const player = usePlayerId()
  const [history, setHistory] = useState<MoveHistory[]>([])
  const [isLoaded, setLoaded] = useState(false)
  const setup = useGameSelector((state) => state.setup) ?? {}
  const playedMoves = useGameSelector((state) => state.playedMoves)
  const gameOver = useGameSelector((state) => state.gameOver)
  const actions = useGameSelector((state) => state.actions)

  const actionMap = useMemo(() => buildActionMap(actions), [actions])
  const getAction = (actionId: string) => actionMap.get(actionId)

  const moves = useRef<PlayedMove[]>([])
  const engine = useRef<HistoryEngine | null>(null)
  const playedMovesRef = useRef<PlayedMove[]>([])
  const idleCallbackId = useRef<number | null>(null)
  const processingIndex = useRef<number>(0)
  const pendingEntries = useRef<MoveHistory[]>([])
  const pendingMoves = useRef<PlayedMove[]>([])

  useEffect(() => {
    if (!engine.current && setup) {
      engine.current = {
        rules: new context.Rules(JSON.parse(JSON.stringify(setup)), gameOver ? undefined : { player }),
        checkpoints: [],
        movesProcessed: 0
      }
    }
  }, [setup])

  const makeLogContext = () => ({
    logs: context.logs,
    RulesClass: context.Rules,
    setup,
    gameOver,
    player,
    getAction
  })

  const processBatch = (deadline: { timeRemaining: () => number }) => {
    if (!engine.current) return
    const movesToProcess = pendingMoves.current
    const ctx = makeLogContext()
    let i = processingIndex.current

    while (i < movesToProcess.length && deadline.timeRemaining() > 1) {
      const move = movesToProcess[i]
      const entry = getMoveEntry(move, moves.current.length + i, engine.current, playedMovesRef.current, ctx)
      if (entry) pendingEntries.current.push(entry)
      playMoveOnEngine(engine.current, move, getAction)
      saveCheckpointIfNeeded(engine.current, moves.current.length + i + 1)
      i++
    }

    processingIndex.current = i

    if (i < movesToProcess.length) {
      if (pendingEntries.current.length > 0) {
        const entriesToFlush = pendingEntries.current
        pendingEntries.current = []
        setHistory((h) => h.concat(entriesToFlush))
      }
      idleCallbackId.current = scheduleIdle(processBatch)
    } else {
      if (pendingEntries.current.length > 0) {
        const entriesToFlush = pendingEntries.current
        pendingEntries.current = []
        setHistory((h) => h.concat(entriesToFlush))
      }
      const processedCount = movesToProcess.length
      moves.current = playedMovesRef.current.slice(0, moves.current.length + processedCount)
      idleCallbackId.current = null
      pendingMoves.current = []
      processingIndex.current = 0
    }
  }

  useEffect(() => {
    if (playedMoves !== undefined && !isLoaded) setLoaded(true)
  }, [playedMoves])

  useEffect(() => {
    if (!playedMoves || !engine.current) return
    playedMovesRef.current = playedMoves

    const actualSize = moves.current.length
    const ctx = makeLogContext()

    if (actualSize < playedMoves.length) {
      if (idleCallbackId.current !== null) {
        cancelIdle(idleCallbackId.current)
        idleCallbackId.current = null
      }

      const newMoves = playedMoves.slice(actualSize - playedMoves.length)

      if (newMoves.length <= 20) {
        const entries = processMovesSync(newMoves, actualSize, engine.current, playedMovesRef.current, ctx)
        setHistory((h) => h.concat(entries))
        moves.current = playedMoves
      } else {
        pendingMoves.current = newMoves
        pendingEntries.current = []
        processingIndex.current = 0
        idleCallbackId.current = scheduleIdle(processBatch)
      }
    } else if (actualSize > playedMoves.length) {
      if (idleCallbackId.current !== null) {
        cancelIdle(idleCallbackId.current)
        idleCallbackId.current = null
      }

      const firstIndexChange = moves.current.findIndex((currentMove, index) => currentMove.actionId !== playedMoves[index]?.actionId)
      const invalidatedMoves = moves.current.slice(firstIndexChange)
      const lastValidHistoryIndex = findLastIndex(history, (moveHistory) => !invalidatedMoves.some((move) => move.actionId === moveHistory.action.id))

      // Use the nearest checkpoint at or before the invalidation point instead of replaying from a history entry's game state
      const validCheckpoints = engine.current.checkpoints.filter((cp) => cp.moveIndex <= firstIndexChange)
      const nearestCheckpoint = validCheckpoints.length > 0 ? validCheckpoints[validCheckpoints.length - 1] : undefined
      const restartState = nearestCheckpoint ? nearestCheckpoint.gameState : setup
      const restartIndex = nearestCheckpoint ? nearestCheckpoint.moveIndex : 0

      engine.current.checkpoints = validCheckpoints
      engine.current.rules = new context.Rules(JSON.parse(JSON.stringify(restartState)), gameOver ? undefined : { player })

      // Replay from checkpoint to the start of remaining moves
      for (let i = restartIndex; i < firstIndexChange; i++) {
        playMoveOnEngine(engine.current, playedMoves[i], getAction)
      }

      // Find the last valid history entry that's still in the new playedMoves
      const lastValidHistory = lastValidHistoryIndex !== -1 ? history[lastValidHistoryIndex] : undefined
      const replayStartIndex = lastValidHistory
        ? findLastIndex(playedMoves, move =>
          move.actionId === lastValidHistory.action.id && move.consequenceIndex === lastValidHistory.consequenceIndex
        )
        : firstIndexChange

      // Replay moves between firstIndexChange and replayStartIndex (these have valid history entries already)
      for (let i = firstIndexChange; i < replayStartIndex; i++) {
        playMoveOnEngine(engine.current, playedMoves[i], getAction)
      }

      // Skip the last valid history move itself
      if (lastValidHistory && replayStartIndex >= 0) {
        playMoveOnEngine(engine.current, playedMoves[replayStartIndex], getAction)
      }

      // Process remaining moves for new entries
      const newMovesStart = lastValidHistory ? replayStartIndex + 1 : firstIndexChange
      const movesToProcess = playedMoves.slice(newMovesStart)
      const entries = processMovesSync(movesToProcess, newMovesStart, engine.current, playedMovesRef.current, ctx)

      setHistory((h) => h.slice(0, lastValidHistoryIndex + 1).concat(entries))
      moves.current = playedMoves
    }
  }, [playedMoves])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleCallbackId.current !== null) {
        cancelIdle(idleCallbackId.current)
      }
    }
  }, [])

  return {
    history,
    isLoaded
  }
}
