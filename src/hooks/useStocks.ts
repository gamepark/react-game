import { gameContext, MaterialDescription, StockDescription } from '../components'
import { useContext, useMemo } from 'react'
import { getStocks } from '../components/material/utils/IsMoveToStock'

export function useStocks<P extends number = number, M extends number = number, L extends number = number>(): Record<M, StockDescription<P, L> | undefined> {
  const material = useContext(gameContext).material as Record<M, MaterialDescription<P, M, L>>
  return useMemo(() => getStocks(material), [material])
}
