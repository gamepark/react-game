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
  const actions = useSelector((state: GamePageState) => state.actions)

  const moves = useRef<PlayedMove[]>([])
  const rules = useRef<Rules>()
  useEffect(() => {
    if (!rules.current && setup) {
      rules.current = new context.Rules(JSON.parse(JSON.stringify(setup)), gameOver ? undefined : { player })
    }
  }, [setup])

  const getAction = (actionId: string) => actions!.find((action) => action.id === actionId)!

  const getMoveEntry = (playedMove: PlayedMove): MoveHistory | undefined => {
    const { move, consequenceIndex } = playedMove
    const action = getAction(playedMove.actionId)
    const moveComponentContext = { move, consequenceIndex, action, game: JSON.parse(JSON.stringify(rules.current!.game)) }
    const description = context.logs?.getMovePlayedLogDescription(move, moveComponentContext)
    if (!description?.Component) return
    return { ...moveComponentContext, ...description }
  }

  useEffect(() => {
    if (playedMoves !== undefined && !isLoaded) setLoaded(true)
  }, [playedMoves])

  useEffect(() => {
    if (!playedMoves) return
    const actualSize = moves.current.length
    if (actualSize < playedMoves.length) {
      const newMoves = playedMoves.slice(actualSize - playedMoves.length)
      const entries: MoveHistory[] = []
      for (const move of newMoves) {
        const entry = getMoveEntry(move)
        if (entry) entries.push(entry)
        const action = getAction(move.actionId)
        rules.current?.play(move.move, { local: action.local })
      }
      setHistory((h) => h.concat(entries))
    } else if (actualSize > playedMoves.length) {
      const firstIndexChange = moves.current.findIndex((currentMove, index) => currentMove.actionId !== playedMoves[index]?.actionId)
      const invalidatedMoves = moves.current.slice(firstIndexChange)
      const lastValidHistoryIndex = findLastIndex(history, (moveHistory) => !invalidatedMoves.some((move) => move.actionId === moveHistory.action.id))
      const lastValidHistory = lastValidHistoryIndex !== -1 ? history[lastValidHistoryIndex] : undefined
      const previousGameState = lastValidHistory ? lastValidHistory.game : setup
      rules.current = new context.Rules(JSON.parse(JSON.stringify(previousGameState)), gameOver ? undefined : { player })
      const movesToReplay = lastValidHistory ?
        playedMoves.slice(findLastIndex(playedMoves, move =>
          move.actionId === lastValidHistory.action.id && move.consequenceIndex === lastValidHistory.consequenceIndex
        ))
        : playedMoves
      if (lastValidHistory) {
        const move = movesToReplay.shift()!
        const action = getAction(move.actionId)
        rules.current.play(move.move, { local: action.local })
      }
      const entries: MoveHistory[] = []
      for (const move of movesToReplay) {
        const entry = getMoveEntry(move)
        if (entry) entries.push(entry)
        const action = getAction(move.actionId)
        rules.current.play(move.move, { local: action.local })
      }

      setHistory((h) => h.slice(0, lastValidHistoryIndex + 1).concat(entries))
    }

    moves.current = playedMoves
  }, [playedMoves])

  return {
    history,
    isLoaded
  }
}
