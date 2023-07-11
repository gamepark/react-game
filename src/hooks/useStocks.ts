import { StockDescription } from '../components'
import { useMemo } from 'react'
import { useMaterialContext } from './useMaterialContext'
import mapValues from 'lodash/mapValues'

export function useStocks<P extends number = number, M extends number = number, L extends number = number>(): Record<M, StockDescription<P, L>[]> {
  const context = useMaterialContext<P, M, L>()
  return useMemo(() => mapValues(context.material, material => material.getStocks(context)), [context])
}
