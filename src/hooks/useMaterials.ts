import { gameContext, MaterialDescription } from '../components'
import { useContext } from 'react'

export function useMaterials<P extends number = number, M extends number = number, L extends number = number>(): Record<M, MaterialDescription<P, M, L>> | undefined {
  return useContext(gameContext).material as Record<M, MaterialDescription<P, M, L>> | undefined
}
