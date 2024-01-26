import { DisplayedAction, GamePageState } from '@gamepark/react-client'
import size from 'lodash/size'
import keyBy from 'lodash/keyBy'
import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { gameContext } from '../components'
import { useActions } from './useActions'

export type Histories = Record<string, ReactElement[] | undefined>

export const useHistory = () => {
  const context = useContext(gameContext)
  const setup = useSelector((state: GamePageState) => state.setup) ?? {}
  const actions = useActions() ?? []
  const filteredActions = useMemo(() => (actions ?? []).filter((a) => a.id !== undefined), [actions])
  const historyRef = useRef<Histories>({})
  const rules = new context.Rules(JSON.parse(JSON.stringify(setup)))
  const history = context.history!
  const getMoveEntry = useCallback((action, move, consequenceIndex, rules) => {
    const getGameAfter = () => {
      const rulesCopy = new context.Rules(JSON.parse(JSON.stringify(rules.game)))
      rulesCopy.play(move)
      return rulesCopy.game
    }

    const historyContext = {
      consequenceIndex: consequenceIndex,
      action: action,
      getGameBefore: () => JSON.parse(JSON.stringify(rules.game)),
      getGameAfter
    }

    return history.getHistoryEntry(move, consequenceIndex, historyContext)
  }, [context])

  const addActionEntries = useCallback((histories: Histories, action: DisplayedAction) => {
    histories[action.id!] = []
    const actionEntry = getMoveEntry(action, action.move, undefined, rules)
    rules.play(action.move)
    if (actionEntry) histories[action.id!]!.push(actionEntry)

    for (let index = 0; index < action.consequences.length; index++) {
      const consequence = action.consequences[index]
      const consequenceEntry = getMoveEntry(action, consequence, index, rules)
      rules.play(consequenceEntry)
      if (consequenceEntry) histories[action.id!]!.push(consequenceEntry)
    }
  }, [rules])

  useEffect(() => {
    if (!historyRef.current) return
    const histories = historyRef.current
    const actualSize = size(histories)
    if (actualSize < filteredActions.length) {
      for (const action of filteredActions) {
        if (action.id! in histories) continue
        addActionEntries(histories, action)
      }
    } else {
      const actionsById = keyBy(filteredActions, (a) => a.id!)
      for (const key of Object.keys(histories)) {
        if (!(key in actionsById)) delete histories[key]
      }

      historyRef.current = histories
    }


  }, [filteredActions.length])

  useEffect(() => {
    const histories: Histories = {}
    for (const action of filteredActions) {
      addActionEntries(histories, action)
    }

    historyRef.current = histories
  }, [])

  if (!setup) return []

  return historyRef.current
}