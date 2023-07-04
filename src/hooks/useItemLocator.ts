import { ItemLocator } from '../locators'
import { useLocators } from './useLocators'

export function useItemLocator<P extends number = number, M extends number = number, L extends number = number>(
  type: L
): ItemLocator<P, M, L> | undefined {
  return useLocators()?.[type] as ItemLocator<P, M, L> | undefined
}
