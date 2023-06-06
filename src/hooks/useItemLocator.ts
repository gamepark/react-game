import { gameContext } from '../components'
import { useContext } from 'react'
import { ItemLocator } from '../locators'

export function useItemLocator<P extends number = number, M extends number = number, L extends number = number>(
  type: L
): ItemLocator<P, M, L> | undefined {
  return useContext(gameContext).locators?.[type] as ItemLocator<P, M, L> | undefined
}
