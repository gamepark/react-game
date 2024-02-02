import { DisplayedAction, GamePageState, HistoryEntryOptions } from '@gamepark/react-client'
import keyBy from 'lodash/keyBy'
import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { gameContext } from '../components'
import { useActions } from './useActions'

export type Histories = Map<string, ReactElement[] | undefined>

export const useHistory = () => {
  const context = useContext(gameContext)
  const setup = useSelector((state: GamePageState) => state.setup) ?? {}
  const actions = useActions() ?? []
  const filteredActions = useMemo(() => (actions ?? []).filter((a) => !a.pending && a.id !== undefined), [actions])
  const historyRef = useRef<Histories>(new Map<string, ReactElement[] | undefined>())
  const [historySize, setHistorySize] = useState(0)
  const rules = new context.Rules(JSON.parse(JSON.stringify(setup)))
  const history = context.history!
  const getMoveEntry = useCallback((action, move, consequenceIndex, rules) => {
    const getGameAfter = () => {
      const rulesCopy = new context.Rules(JSON.parse(JSON.stringify(rules.game)))
      rulesCopy.play(move)
      return rulesCopy.game
    }

    const historyContext: HistoryEntryOptions = {
      consequenceIndex: consequenceIndex,
      action: action,
      getGameBefore: () => JSON.parse(JSON.stringify(rules.game)),
      getGameAfter
    }

    return history.getHistoryEntry(move, historyContext)
  }, [context])

  const addActionEntries = useCallback((histories: Histories, action: DisplayedAction) => {
    histories.set(action.id!, [])
    const actionEntry = getMoveEntry(action, action.move, undefined, rules)
    rules.play(action.move)
    if (actionEntry) histories.get(action.id!)!.push(actionEntry)

    for (let index = 0; index < action.consequences.length; index++) {
      const consequence = action.consequences[index]
      const consequenceEntry = getMoveEntry(action, consequence, index, rules)
      rules.play(consequence)

      if (consequenceEntry) histories.get(action.id!)!.push(consequenceEntry)
    }
  }, [rules])

  useEffect(() => {
    if (!historyRef.current) return
    const histories = historyRef.current
    const actualSize = histories.size
    if (actualSize < filteredActions.length) {
      for (const action of filteredActions) {
        if (action.id! in histories) continue
        addActionEntries(histories, action)
      }

      setHistorySize(histories.size)
      historyRef.current = histories
    } else {
      const actionsById = keyBy(filteredActions, (a) => a.id!)
      for (const key of histories.keys()) {
        if (!(key in actionsById)) histories.delete(key)
      }

      setHistorySize(histories.size)
      historyRef.current = histories
    }


  }, [filteredActions.length])

  useEffect(() => {
    const histories: Histories = new Map()
    for (const action of filteredActions) {
      addActionEntries(histories, action)
    }

    setHistorySize(histories.size)
    historyRef.current = histories
  }, [])

  return {
    histories: historyRef.current,
    size: historySize
  }
}