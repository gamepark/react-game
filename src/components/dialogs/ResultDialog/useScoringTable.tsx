import { ScoringValue } from '@gamepark/react-client/dist/Scoring/ScoringDescription'
import { useContext, useMemo } from 'react'
import { useRules } from '../../../hooks'
import { gameContext } from '../../GameProvider'

export const useScoringHeader = () => {
  const rules = useRules()
  const context = useContext(gameContext)
  const scoring = context.scoring
  return useMemo(() => {
    if (!rules || !scoring) return []
    const keys = scoring.getScoringKeys(rules) ?? []
    return keys
      .map((key) => scoring.getScoringHeader(key, rules))
      .map(ensureComponent)
  }, [rules, scoring])
}

export const usePlayerScoring = (playerId: number) => {
  const rules = useRules()
  const context = useContext(gameContext)
  const scoring = context.scoring
  return useMemo(() => {
    if (!rules || !scoring) return []
    const keys = scoring.getScoringKeys(rules) ?? []
    return keys
      .map((key) => scoring.getScoringPlayerData(key, playerId, rules))
      .map(ensureComponent)
  }, [rules, scoring])

}

const ensureComponent = (content: ScoringValue | null) => {
  if (typeof content === 'string' || typeof content === 'number') return <>{content}</>
  return content
}