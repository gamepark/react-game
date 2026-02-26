import { createContext, RefObject, useContext } from 'react'
import { MaterialContext } from '../locators'

export const MaterialContextRefContext = createContext<RefObject<MaterialContext>>(null!)

/**
 * Returns the MaterialContext from a stable ref. Does NOT subscribe to Redux state,
 * so reading this does not trigger re-renders when game state changes.
 *
 * Must be used inside a MaterialContextRefContext.Provider (provided by DynamicItemsTypeDisplay or StaticItemsTypeDisplay).
 */
export function useMaterialContextRef<P extends number = number, M extends number = number, L extends number = number>(): MaterialContext<P, M, L> {
  return useContext(MaterialContextRefContext).current as unknown as MaterialContext<P, M, L>
}
