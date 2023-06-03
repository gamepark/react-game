/** @jsxImportSource @emotion/react */
import { MaterialDescription } from './MaterialDescription'
import { forwardRef, HTMLAttributes, MouseEvent } from 'react'
import { MaterialComponentType } from './MaterialComponentType'
import { Board } from './Board'
import { Card } from './Card'
import { Token } from './Token'
import mapValues from 'lodash.mapvalues'
import { MaterialRules, MaterialRulesMove } from '@gamepark/rules-api'
import { LongPressCallbackReason, LongPressEventType, useLongPress } from 'use-long-press'
import { ItemLocator } from '../../locators'
import { combineEventListeners } from '../../utilities'

export type MaterialComponentProps<ItemId extends number = number, P extends number = number, M extends number = number, L extends number = number> = {
  description: MaterialDescription
  itemId?: ItemId
  locators?: Partial<Record<L, ItemLocator<P, M, L>>>
  legalMovesTo?: MaterialRulesMove<P, M, L>[]
  rules?: MaterialRules<P, M, L>
  onShortClick?: () => void
  onLongClick?: () => void
} & HTMLAttributes<HTMLElement>

export const MaterialComponent = forwardRef<HTMLDivElement, MaterialComponentProps>((
  { description, itemId, locators, legalMovesTo, rules, onShortClick, onLongClick = onShortClick, ...props }, ref
) => {
  const itemProps = getPropForItem(description.props, itemId)

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

  switch (description.type) {
    case MaterialComponentType.Board:
      return <Board ref={ref} {...itemProps} {...props} {...combineEventListeners(listeners, props)}>
        {description.getLocations ? description.getLocations(itemId, legalMovesTo) : locators && rules && createLocations(rules, locators, itemId, legalMovesTo)}
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

const createLocations = (rules: MaterialRules, locators: Partial<Record<number, ItemLocator>>, itemId: number | undefined, moves: MaterialRulesMove<number, number, number>[] = []) => {
  return <>
    {Object.entries(locators).map(([_locationTypeString, locator]) =>
      locator && locator.createLocationsOnItem(itemId, moves, rules)
    )}
  </>
}
