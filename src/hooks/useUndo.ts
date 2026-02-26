import { isActionToAnimate, undoMove, useGameDispatch, useGameSelector } from '@gamepark/react-client'
import { hasUndo } from '@gamepark/rules-api'
import { findLastIndex } from 'es-toolkit/compat'
import { useCallback, useContext, useRef } from 'react'
import { gameContext } from '../components'

export type UndoOptions = { delayed?: boolean }
export type MovePredicate<Move> = (move: Move) => boolean
export type CanUndo<Move> = (movePredicate?: MovePredicate<Move>) => boolean
export type UndoFunction<Move> = ((arg?: string | number | MovePredicate<Move> | UndoOptions, options?: UndoOptions) => void)

export const useUndo = <Move = any>(): [UndoFunction<Move>, CanUndo<Move>] => {
  const actions = useGameSelector((state) => state.actions)
  const game = useGameSelector((state) => state.state)
  const playerId = useGameSelector((state) => state.playerId)
  const dispatch = useGameDispatch()
  const Rules = useContext(gameContext)?.Rules
  if (!Rules) throw new Error('Cannot useUndo outside a GameProvider')

  // Use refs so that undo/canUndo callbacks have stable references
  // and don't cause downstream useMemo/re-renders when actions/game change during animations
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  const gameRef = useRef(game)
  gameRef.current = game

  const undo: UndoFunction<Move> = useCallback((arg?: string | number | MovePredicate<Move> | UndoOptions, options?: UndoOptions) => {
    if (typeof arg === 'string') {
      dispatch(undoMove({ actionId: arg, delayed: options?.delayed }))
    } else {
      const actions = actionsRef.current
      if (!actions) return console.error('Cannot undo before actions history is loaded')
      const actionToUndo = findLastN(actions, action =>
          action.playerId === playerId && !action.cancelled && (typeof arg !== 'function' || arg(action.move)),
        typeof arg === 'number' ? arg : 1
      )
      if (!actionToUndo.length) return console.error('This action does not exist, it cannot be undone')
      const delayed = typeof arg === 'object' ? arg?.delayed : options?.delayed
      for (const action of actionToUndo) {
        if (action.id) {
          dispatch(undoMove({ actionId: action.id, delayed }))
        }
      }
    }
  }, [playerId, dispatch])

  const canUndo: CanUndo<Move> = useCallback((movePredicate?: MovePredicate<Move>) => {
    const game = gameRef.current
    const actions = actionsRef.current
    if (!game || !actions) return false
    if (actions.some(action =>
      action.playerId === playerId && (isActionToAnimate(action) || action.animation !== undefined)
    )) return false
    const index = findLastIndex(actions, action =>
      action.playerId === playerId && !action.cancelled && (!movePredicate || movePredicate(action.move))
    )
    if (index === -1) return false
    const action = actions[index]
    if (action.pending) return false
    if (action.local) return true
    const consecutiveActions = actions.slice(index + 1).filter(action => !action.cancelled)
    const rules = new Rules(game, { player: playerId })
    if (!hasUndo(rules)) return false
    return rules.canUndo(action, consecutiveActions)
  }, [playerId, Rules])

  return [undo, canUndo]
}

function findLastN<T>(array: T[], predicate: (item: T) => boolean, n: number = 1): T[] {
  const result: T[] = []
  for (let i = array.length - 1; i >= 0; i--) {
    const item = array[i]
    if (predicate(item)) {
      result.push(item)
      if (result.length >= n) return result
    }
  }
  return result
}
