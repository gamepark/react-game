/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent, useContext } from 'react'
import { MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { ItemLocator, PlaceLocationContext } from '../../locators'
import { combineEventListeners } from '../../utilities'
import { useGame, useMaterialDescription, usePlayerId, useRules } from '../../hooks'
import pickBy from 'lodash/pickBy'
import { gameContext } from '../GameProvider'
import { FlatMaterial, isFlatMaterialDescription } from './FlatMaterial'
import { ComponentCommonProps } from './MaterialDescription'

export type MaterialComponentProps<ItemId = any, P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  itemId?: ItemId
  withLocations?: boolean
  legalMovesTo?: MaterialMove<P, M, L>[]
  onShortClick?: () => void
  onLongClick?: () => void
} & ComponentCommonProps & HTMLAttributes<HTMLElement>

export const MaterialComponent = forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, withLocations, legalMovesTo, onShortClick, onLongClick = onShortClick, ...props }, ref
) => {
  const context = useContext(gameContext)
  const game = useGame<MaterialGame>()
  const player = usePlayerId()
  const material = context.material
  const description = useMaterialDescription(type)
  const locators = context.locators
  const rules = useRules<MaterialRules>()

  const innerLocators = pickBy(locators, locator => locator?.parentItemType === type)

  const listeners = useLongPress(() => onLongClick && onLongClick(), {
    detect: LongPressEventType.Pointer,
    cancelOnMovement: 5,
    threshold: 600,
    onCancel: (_, { reason }) => {
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        setTimeout(() => onShortClick && onShortClick())
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })()

  if (!description || !locators || !rules || !game || !material) return null

  if (isFlatMaterialDescription(description)) {
    return (
      <FlatMaterial ref={ref} {...description.getFlatMaterialProps(itemId)} {...props} {...combineEventListeners(listeners, props)}>
        {withLocations && (
          description.getLocations ?
            description.getLocations(itemId, legalMovesTo)
            : createLocations(rules, innerLocators, { game, material, locators, player, parentItemId: itemId })
        )}
      </FlatMaterial>
    )
  }

  return null
})

const createLocations = (rules: MaterialRules, locators: Partial<Record<number, ItemLocator>>, context: PlaceLocationContext) => {
  return <>
    {Object.entries(locators).map(([, locator]) =>
      locator && locator.createLocations(rules, context)
    )}
  </>
}
