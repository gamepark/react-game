import { DisplayedAction, gameContext, GamePageState, moveUndone } from '@gamepark/react-client'
import { hasUndo, replayActions } from '@gamepark/rules-api'
import { useCallback, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import findLast from 'lodash.findlast'
import findLastIndex from 'lodash.findlastindex'

export type UndoOptions = { delayed?: boolean }
export type MovePredicate<Move> = (move: Move) => boolean
export type CanUndo<Move> = (movePredicate?: MovePredicate<Move>) => boolean
export type UndoFunction<Move> = ((arg?: string | MovePredicate<Move> | UndoOptions, options?: UndoOptions) => void)

export const useUndo = <Move = any, PlayerId = any, Game = any>(): [UndoFunction<Move>, CanUndo<Move>] => {
  const actions = useSelector<GamePageState<Game, Move, PlayerId>, DisplayedAction<Move, PlayerId>[] | undefined>(state => state.actions)
  const setup = useSelector<GamePageState<Game, Move, PlayerId>, Game | undefined>(state => state.setup)
  const playerId = useSelector<GamePageState<Game, Move, PlayerId>, PlayerId | undefined>(state => state.playerId)
  const dispatch = useDispatch()
  const RulesView = useContext(gameContext)?.RulesView
  if (!RulesView) throw new Error('Cannot useUndo outside a GameProvider')

  const undo: UndoFunction<Move> = useCallback((arg?: string | MovePredicate<Move> | UndoOptions, options?: UndoOptions) => {
    if (typeof arg === 'string') {
      dispatch(moveUndone(arg, options?.delayed))
    } else {
      if (!actions) return console.error('Cannot undo before actions history is loaded')
      const action = findLast(actions, action => action.playerId === playerId && !action.cancelled && (typeof arg !== 'function' || arg(action.move)))
      if (!action) return console.error('This action does not exist, it cannot be undone')
      const delayed = typeof arg !== 'function' ? arg?.delayed : options?.delayed
      if (action.id) {
        dispatch(moveUndone(action.id, delayed))
      }
    }
  }, [actions, playerId, dispatch])

  const canUndo: CanUndo<Move> = useCallback((movePredicate?: MovePredicate<Move>) => {
    if (!setup || !actions) return false
    const index = findLastIndex(actions, action => action.playerId === playerId && !action.cancelled && (!movePredicate || movePredicate(action.move)))
    if (index === -1) return false
    const action = actions[index]
    if (action.pending) return false
    const consecutiveActions = actions.slice(index + 1).filter(action => !action.cancelled)
    const rules = new RulesView(JSON.parse(JSON.stringify(setup)))
    if (!hasUndo(rules)) return false
    replayActions(rules, actions.filter(action => !action.delayed && !action.cancelled))
    return rules.canUndo(action, consecutiveActions)
  }, [setup, actions, playerId, RulesView])

  return [undo, canUndo]
}
