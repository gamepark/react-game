/** @jsxImportSource @emotion/react */
import { forwardRef, HTMLAttributes, MouseEvent, useContext } from 'react'
import { MaterialComponentType } from './MaterialComponentType'
import { Board } from './Board'
import { Card } from './Card'
import { Token } from './Token'
import mapValues from 'lodash/mapValues'
import { MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { ItemLocator } from '../../locators'
import { combineEventListeners } from '../../utilities'
import pickBy from 'lodash/pickBy'
import { useMaterialDescription, useRules } from '../../hooks'
import { gameContext } from '../GameProvider'

export type MaterialComponentProps<ItemId extends number = number, P extends number = number, M extends number = number, L extends number = number> = {
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
  const description = useMaterialDescription(type)
  const locators = useContext(gameContext).locators
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

  if (!description || !locators || !rules) return null

  const itemProps = getPropForItem(description.props, itemId)

  switch (description.type) {
    case MaterialComponentType.Board:
      return <Board ref={ref} {...itemProps} {...props} {...combineEventListeners(listeners, props)}>
        {withLocations && (
          description.getLocations ? description.getLocations(itemId, legalMovesTo) : createLocations(rules, innerLocators, itemId, legalMovesTo)
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

const createLocations = (rules: MaterialRules, locators: Partial<Record<number, ItemLocator>>, itemId: number | undefined, moves: MaterialMove<number, number, number>[] = []) => {
  return <>
    {Object.entries(locators).map(([, locator]) =>
      locator && locator.createLocationsOnItem(itemId, moves, rules)
    )}
  </>
}
