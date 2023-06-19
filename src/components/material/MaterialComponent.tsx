/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent, useContext } from 'react'
import { MaterialComponentType } from './MaterialComponentType'
import { Board } from './Board'
import { Card } from './Card'
import { Token } from './Token'
import { MaterialGame, MaterialMove, MaterialRules } from '@gamepark/rules-api'
import mapValues from 'lodash/mapValues'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { BaseContext, ItemLocator } from '../../locators'
import { combineEventListeners } from '../../utilities'
import { useGame, useMaterialDescription, usePlayerId, useRules } from '../../hooks'
import pickBy from 'lodash/pickBy'
import { gameContext } from '../GameProvider'

export type MaterialComponentProps<ItemId = any, P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  itemId?: ItemId
  withLocations?: boolean
  legalMovesTo?: MaterialMove<P, M, L>[]
  onShortClick?: () => void
  onLongClick?: () => void
} & HTMLAttributes<HTMLElement>

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

  const itemProps = getPropForItem(description.props, itemId)

  switch (description.type) {
    case MaterialComponentType.Board:
      return <Board ref={ref} {...itemProps} {...props} {...combineEventListeners(listeners, props)}>
        {withLocations && (
          description.getLocations ? description.getLocations(itemId, legalMovesTo) : createLocations(rules, innerLocators, itemId, legalMovesTo, {
            game,
            material,
            locators,
            player
          })
        )}
      </Board>
    case MaterialComponentType.Card:
      return <Card ref={ref} {...itemProps} {...props} {...combineEventListeners(listeners, props)}/>
    case MaterialComponentType.Token:
      return <Token ref={ref} {...itemProps} {...props} {...combineEventListeners(listeners, props)}/>
    default:
      return null
  }
})

export const getPropForItem = <Id extends number = number>(prop: any, itemId?: Id): any => {
  if (typeof prop === 'object') {
    if (isIdRecord<Id>(prop)) {
      return itemId !== undefined ? prop[itemId] : undefined
    } else {
      return mapValues(prop, p => getPropForItem(p, itemId))
    }
  } else if (typeof prop === 'function') {
    return prop(itemId)
  } else {
    return prop
  }
}

const isIdRecord = <Id extends number = number>(prop: Object): prop is Record<Id, any> => {
  return !isNaN(parseInt(Object.keys(prop)[0]))
}

const createLocations = (rules: MaterialRules, locators: Partial<Record<number, ItemLocator>>, itemId: number | undefined, moves: MaterialMove<number, number, number>[] = [], context: BaseContext) => {
  return <>
    {Object.entries(locators).map(([, locator]) =>
      locator && locator.createLocationsOnItem(itemId, moves, rules, context)
    )}
  </>
}
