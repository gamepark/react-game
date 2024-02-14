import { DisplayedAction, GamePageState } from '@gamepark/react-client'
import keyBy from 'lodash/keyBy'
import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { gameContext, HistoryEntryContext } from '../components'
import { useActions } from './useActions'

export type Histories = Map<string, ReactElement[] | undefined>

export const useHistory = () => {
  const context = useContext(gameContext)
  const setup = useSelector((state: GamePageState) => state.setup) ?? {}
  const actions = useActions() ?? []
  const filteredActions = useMemo(() => (actions ?? []).filter((a) => !a.pending && a.id !== undefined), [actions])
  const historyRef = useRef<Histories>(new Map<string, ReactElement[] | undefined>())
  const [historySize, setHistorySize] = useState(0)
  const rules = useMemo(() => new context.Rules(JSON.parse(JSON.stringify(setup))), [setup])
  const MaterialHistory = context.MaterialHistory!
  const getMoveEntry = useCallback((action, move, consequenceIndex, rules) => {
    const historyContext: HistoryEntryContext = {
      consequenceIndex: consequenceIndex,
      action: action,
      game: JSON.parse(JSON.stringify(rules.game))
    }

    return <MaterialHistory move={move} context={historyContext} />
  }, [context])

  const addActionEntries = useCallback((histories: Histories, action: DisplayedAction) => {
    histories.set(action.id!, [])
    const actionEntry = getMoveEntry(action, action.move, undefined, rules)
    rules.play(action.move)
    histories.get(action.id!)!.push(actionEntry)

    for (let index = 0; index < action.consequences.length; index++) {
      const consequence = action.consequences[index]
      const consequenceEntry = getMoveEntry(action, consequence, index, rules)
      rules.play(consequence)
      histories.get(action.id!)!.push(consequenceEntry)
    }
  }, [rules])

  useEffect(() => {
    const histories = historyRef.current
    const actualSize = histories.size
    if (actualSize < filteredActions.length) {
      for (const action of filteredActions) {
        if (histories.has(action.id!)) continue
        addActionEntries(histories, action)
      }

      setHistorySize(histories.size)
      historyRef.current = histories
    } else if (actualSize > filteredActions.length) {
      const actionsById = keyBy(filteredActions, (a) => a.id!)
      for (const key of Array.from(histories.keys())) {
        if (!(key in actionsById)) histories.delete(key)
      }

      setHistorySize(histories.size)
      historyRef.current = histories
    }
  }, [filteredActions.length])

  return {
    histories: historyRef.current,
    size: historySize
  }
}