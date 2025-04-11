import { DisplayedAction, GamePageState, PlayedMove } from '@gamepark/react-client'
import { MaterialMove, Rules } from '@gamepark/rules-api'
import findLastIndex from 'lodash/findLastIndex'
import { useContext, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { gameContext, MovePlayedLogDescription } from '../components'
import { usePlayerId } from './usePlayerId'


export type MoveHistory<Move = any, Player = any, Game = any> = MovePlayedLogDescription<Move, Player> & {
  action: DisplayedAction<Move, Player>
  move: MaterialMove
  game: Game
  consequenceIndex?: number
}

export const useFlatHistory = () => {
  const context = useContext(gameContext)
  const player = usePlayerId()
  const [history, setHistory] = useState<MoveHistory[]>([])
  const [isLoaded, setLoaded] = useState(false)
  const setup = useSelector((state: GamePageState) => state.setup) ?? {}
  const playedMoves = useSelector((state: GamePageState) => state.playedMoves)
  const gameOver = useSelector((state: GamePageState) => state.gameOver)

  const movesCount = useRef<number>(0)
  const rules = useRef<Rules>()
  useEffect(() => {
    if (!rules.current && setup) {
      rules.current = new context.Rules(JSON.parse(JSON.stringify(setup)), gameOver ? undefined : { player })
    }
  }, [setup, gameOver])

  const getMoveEntry = (playedMove: PlayedMove): MoveHistory | undefined => {
    const { move } = playedMove
    const moveComponentContext = { ...playedMove, game: rules.current!.game }
    const description = context.logs?.getMovePlayedLogDescription(move, moveComponentContext)
    if (!description?.Component) return
    return {
      ...playedMove,
      game: JSON.parse(JSON.stringify(rules.current!.game)),
      ...description
    }
  }

  useEffect(() => {
    if (playedMoves !== undefined && !isLoaded) setLoaded(true)
  }, [playedMoves])

  useEffect(() => {
    const actualSize = movesCount.current!
    if (!playedMoves) return
    if (actualSize < playedMoves.length) {
      const newMoves = playedMoves.slice(actualSize - playedMoves.length)
      const entries: MoveHistory[] = []
      for (const move of newMoves) {
        const entry = getMoveEntry(move)
        if (entry) entries.push(entry)
        rules.current?.play(move.move, { local: move.action.local })
      }
      setHistory((h) => h.concat(entries))
    } else if (actualSize > playedMoves.length) {
      const newPlayedMoveActionId = new Set(playedMoves.map((m) => m.action.id))
      const firstDeletedActionIndex = history.findIndex((m) => !newPlayedMoveActionId.has(m.action.id))
      if (firstDeletedActionIndex === -1) return // The action which was undone did not generate any history entry
      const previousHistoryEntry = firstDeletedActionIndex > 0 ? history[firstDeletedActionIndex - 1] : undefined
      const previousGameState = previousHistoryEntry ? previousHistoryEntry.game : setup
      rules.current = new context.Rules(previousGameState)
      const movesToReplay = previousHistoryEntry ?
        playedMoves.slice(1 + findLastIndex(playedMoves, move =>
          move.action.id === previousHistoryEntry.action.id && move.consequenceIndex === previousHistoryEntry.consequenceIndex
        ))
        : playedMoves
      const entries: MoveHistory[] = []
      for (const move of movesToReplay) {
        const entry = getMoveEntry(move)
        if (entry) entries.push(entry)
        rules.current.play(move.move, { local: move.action.local })
      }

      setHistory((h) => h.slice(0, firstDeletedActionIndex).concat(entries))
    }

    movesCount.current = playedMoves.length
  }, [playedMoves])

  return {
    history,
    isLoaded
  }
}
