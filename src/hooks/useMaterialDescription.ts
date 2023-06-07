import { gameContext, MaterialDescription } from '../components'
import { useContext } from 'react'

export function useMaterialDescription<P extends number = number, M extends number = number, L extends number = number>(
  type: M
): MaterialDescription<P, M, L> | undefined {
  return useContext(gameContext).material?.[type] as MaterialDescription<P, M, L> | undefined
}
