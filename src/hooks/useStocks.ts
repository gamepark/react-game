import { StockDescription } from '../components'
import { useMemo } from 'react'
import { getStocks } from '../components/material/utils/IsMoveToStock'
import { useMaterials } from './useMaterials'

export function useStocks<P extends number = number, M extends number = number, L extends number = number>(): Record<M, StockDescription<P, L> | undefined> {
  const material = useMaterials<P, M, L>()!
  return useMemo(() => getStocks(material), [material])
}
