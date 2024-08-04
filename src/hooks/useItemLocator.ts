import { Locator } from '../locators'
import { useLocators } from './useLocators'

export function useItemLocator<P extends number = number, M extends number = number, L extends number = number>(
  type: L
): Locator<P, M, L> | undefined {
  return useLocators()?.[type] as Locator<P, M, L> | undefined
}
