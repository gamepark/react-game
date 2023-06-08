import { gameContext, MaterialDescription } from '../components'
import { useContext, useMemo } from 'react'
import { getStocks } from '../components/material/utils/IsMoveToStock'

export function useStocks<P extends number = number, M extends number = number, L extends number = number>(
  type: L
): Record<string, MaterialDescription<P, M, L>> | undefined {
  const material = useContext(gameContext).material as Record<M, MaterialDescription<P, M, L>>
  return useMemo(() => ({ [type]: getStocks(material)?.[type] }), [material])
}
