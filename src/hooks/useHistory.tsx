import { DisplayedAction, GamePageState } from '@gamepark/react-client'
import { replayActions, Rules } from '@gamepark/rules-api'
import keyBy from 'lodash/keyBy'
import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { gameContext, HistoryEntryContext } from '../components'
import { useActions } from './useActions'
import { usePlayerId } from './usePlayerId'

export type Histories = Map<string, ReactElement[] | undefined>

export const useHistory = () => {
  const context = useContext(gameContext)
  const player = usePlayerId()
  const setup = useSelector((state: GamePageState) => state.setup) ?? {}
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const actions = useActions() ?? []
  const filteredActions = useMemo(() => (actions ?? []).filter((a) => !a.local && !a.pending && a.id !== undefined), [actions])
  const historyRef = useRef<Histories>(new Map<string, ReactElement[] | undefined>())
  const [historySize, setHistorySize] = useState(0)
  const rules = useRef<Rules>()
  useEffect(() => {
    if (!rules.current && setup) {
      rules.current = new context.Rules(JSON.parse(JSON.stringify(setup)), gameOver ? undefined : { player })
    }
  }, [setup, gameOver])

  const MaterialHistory = context.MaterialHistory!
  const getMoveEntry = useCallback((action, move, consequenceIndex, rules) => {
    const historyContext: HistoryEntryContext = {
      consequenceIndex: consequenceIndex,
      action: action,
      game: JSON.parse(JSON.stringify(rules.game))
    }

    return <MaterialHistory move={move} context={historyContext}/>
  }, [context])

  const addActionEntries = useCallback((histories: Histories, action: DisplayedAction) => {
    histories.set(action.id!, [])
    const actionEntry = getMoveEntry(action, action.move, undefined, rules.current)
    rules.current?.play(action.move)
    histories.get(action.id!)!.push(actionEntry)

    for (let index = 0; index < action.consequences.length; index++) {
      const consequence = action.consequences[index]
      const consequenceEntry = getMoveEntry(action, consequence, index, rules.current)
      rules.current?.play(consequence)
      histories.get(action.id!)!.push(consequenceEntry)
    }
  }, [])

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

      rules.current = new context.Rules(JSON.parse(JSON.stringify(setup)))
      replayActions(rules.current!, filteredActions)
      setHistorySize(histories.size)
      historyRef.current = histories
    }
  }, [filteredActions.length])

  return {
    histories: historyRef.current,
    size: historySize
  }
}
