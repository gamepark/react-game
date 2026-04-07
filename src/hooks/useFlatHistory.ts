import { DisplayedAction, PlayedMove, useGameSelector } from '@gamepark/react-client'
import { MaterialMove, Rules } from '@gamepark/rules-api'
import { findLastIndex } from 'es-toolkit/compat'
import { useContext, useEffect, useRef, useState } from 'react'
import { gameContext, MovePlayedLogDescription } from '../components'
import { usePlayerId } from './usePlayerId'

const CHECKPOINT_INTERVAL = 50
const BATCH_TIME_BUDGET_MS = 8 // stay under 1 frame (16ms), leave room for rendering

export type MoveHistory<Move = any, Player = any, Game = any> = MovePlayedLogDescription<Move, Player> & {
  action: DisplayedAction<Move, Player>
  move: MaterialMove
  game: Game
  consequenceIndex?: number
}

type Checkpoint = {
  moveIndex: number
  gameState: any
}

/**
 * Replays moves from the nearest checkpoint to produce the game state at a given move index.
 */
const replayFromCheckpoint = (
  targetMoveIndex: number,
  checkpoints: Checkpoint[],
  allPlayedMoves: PlayedMove[],
  RulesClass: any,
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

  const moves = useRef<PlayedMove[]>([])
  const rules = useRef<Rules>(null)
  const checkpoints = useRef<Checkpoint[]>([])
  const playedMovesRef = useRef<PlayedMove[]>([])
  const idleCallbackId = useRef<number | null>(null)
  // Track where we are in the async processing
  const processingIndex = useRef<number>(0)
  const pendingEntries = useRef<MoveHistory[]>([])
  const pendingMoves = useRef<PlayedMove[]>([])

  useEffect(() => {
    if (!rules.current && setup) {
      rules.current = new context.Rules(JSON.parse(JSON.stringify(setup)), gameOver ? undefined : { player })
    }
  }, [setup])

  const getAction = (actionId: string) => actions?.find((action) => action.id === actionId)

  const getMoveEntry = (playedMove: PlayedMove, moveIndex: number): MoveHistory | undefined => {
    const { move, consequenceIndex } = playedMove
    const action = getAction(playedMove.actionId)
    if (!action) return undefined

    let cachedGame: any = undefined
    const moveComponentContext = {
      move, consequenceIndex, action,
      get game() {
        if (cachedGame === undefined) {
          cachedGame = JSON.parse(JSON.stringify(rules.current!.game))
        }
        return cachedGame
      }
    }

    const description = context.logs?.getMovePlayedLogDescription(move, moveComponentContext)
    if (!description?.Component) return

    const capturedMoveIndex = moveIndex
    const capturedCheckpoints = checkpoints.current
    const capturedSetup = setup
    return {
      ...description, move, consequenceIndex, action,
      get game() {
        if (cachedGame === undefined) {
          cachedGame = replayFromCheckpoint(
            capturedMoveIndex, capturedCheckpoints, playedMovesRef.current,
            context.Rules, capturedSetup, gameOver, player, getAction
          )
        }
        return cachedGame
      }
    }
  }

  const playMove = (move: PlayedMove) => {
    try {
      const action = getAction(move.actionId)
      rules.current?.play(JSON.parse(JSON.stringify(move.move)), { local: action?.local })
    } catch (error) {
      console.error('Error while playing a move in useFlatHistory', rules.current?.game, move, error)
    }
  }

  const saveCheckpointIfNeeded = (moveIndex: number) => {
    if (moveIndex > 0 && moveIndex % CHECKPOINT_INTERVAL === 0) {
      checkpoints.current.push({
        moveIndex,
        gameState: JSON.parse(JSON.stringify(rules.current!.game))
      })
    }
  }

  const processBatch = (deadline: { timeRemaining: () => number }) => {
    const movesToProcess = pendingMoves.current
    let i = processingIndex.current

    while (i < movesToProcess.length && deadline.timeRemaining() > 1) {
      const move = movesToProcess[i]
      const entry = getMoveEntry(move, moves.current.length + i)
      if (entry) pendingEntries.current.push(entry)
      playMove(move)
      saveCheckpointIfNeeded(moves.current.length + i + 1)
      i++
    }

    processingIndex.current = i

    if (i < movesToProcess.length) {
      // More moves to process — flush what we have so far and schedule next batch
      if (pendingEntries.current.length > 0) {
        const entriesToFlush = pendingEntries.current
        pendingEntries.current = []
        setHistory((h) => h.concat(entriesToFlush))
      }
      idleCallbackId.current = scheduleIdle(processBatch)
    } else {
      // Done processing all moves
      if (pendingEntries.current.length > 0) {
        const entriesToFlush = pendingEntries.current
        pendingEntries.current = []
        setHistory((h) => h.concat(entriesToFlush))
      }
      // Update the moves ref now that we've processed everything
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
    if (!playedMoves) return
    playedMovesRef.current = playedMoves

    const actualSize = moves.current.length

    if (actualSize < playedMoves.length) {
      // Cancel any in-progress batch processing
      if (idleCallbackId.current !== null) {
        cancelIdle(idleCallbackId.current)
        idleCallbackId.current = null
      }

      const newMoves = playedMoves.slice(actualSize - playedMoves.length)

      // For a small number of new moves (real-time play), process synchronously
      if (newMoves.length <= 20) {
        const entries: MoveHistory[] = []
        let moveIndex = actualSize
        for (const move of newMoves) {
          const entry = getMoveEntry(move, moveIndex)
          if (entry) entries.push(entry)
          playMove(move)
          saveCheckpointIfNeeded(moveIndex + 1)
          moveIndex++
        }
        setHistory((h) => h.concat(entries))
        moves.current = playedMoves
      } else {
        // Large batch (page load / reconnect) — process asynchronously
        pendingMoves.current = newMoves
        pendingEntries.current = []
        processingIndex.current = 0
        idleCallbackId.current = scheduleIdle(processBatch)
      }
    } else if (actualSize > playedMoves.length) {
      // Undo — process synchronously (usually small)
      if (idleCallbackId.current !== null) {
        cancelIdle(idleCallbackId.current)
        idleCallbackId.current = null
      }

      const firstIndexChange = moves.current.findIndex((currentMove, index) => currentMove.actionId !== playedMoves[index]?.actionId)
      const invalidatedMoves = moves.current.slice(firstIndexChange)
      const lastValidHistoryIndex = findLastIndex(history, (moveHistory) => !invalidatedMoves.some((move) => move.actionId === moveHistory.action.id))
      const lastValidHistory = lastValidHistoryIndex !== -1 ? history[lastValidHistoryIndex] : undefined
      const previousGameState = lastValidHistory ? lastValidHistory.game : setup

      checkpoints.current = checkpoints.current.filter((cp) => cp.moveIndex <= firstIndexChange)

      rules.current = new context.Rules(JSON.parse(JSON.stringify(previousGameState)), gameOver ? undefined : { player })
      const movesToReplay = lastValidHistory ?
        playedMoves.slice(findLastIndex(playedMoves, move =>
          move.actionId === lastValidHistory.action.id && move.consequenceIndex === lastValidHistory.consequenceIndex
        ))
        : playedMoves
      if (lastValidHistory) {
        const move = movesToReplay.shift()!
        playMove(move)
      }
      const entries: MoveHistory[] = []
      let moveIndex = playedMoves.length - movesToReplay.length
      for (const move of movesToReplay) {
        const entry = getMoveEntry(move, moveIndex)
        if (entry) entries.push(entry)
        playMove(move)
        saveCheckpointIfNeeded(moveIndex + 1)
        moveIndex++
      }

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
