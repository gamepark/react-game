/** @jsxImportSource @emotion/react */
import { MaterialDescription } from './MaterialDescription'
import { FC, HTMLAttributes, MouseEvent, useCallback, useRef } from 'react'
import { MaterialComponentType } from './MaterialComponentType'
import { Board } from './Board'
import { Card } from './Card'
import { Token } from './Token'
import mapValues from 'lodash.mapvalues'
import { MaterialRules, MaterialRulesMove } from '@gamepark/rules-api'
import { LongPressCallbackReason, useLongPress } from 'use-long-press'
import { ItemLocator } from '../../locators'

type MaterialComponentProps<ItemId extends number = number, P extends number = number, M extends number = number, L extends number = number> = {
  description: MaterialDescription
  itemId?: ItemId
  locators?: Partial<Record<L, ItemLocator<P, M, L>>>
  legalMovesTo?: MaterialRulesMove<P, M, L>[]
  rules?: MaterialRules<P, M, L>
  onLongPress?: () => void
} & HTMLAttributes<HTMLElement>

export const MaterialComponent: FC<MaterialComponentProps> = ({ description, itemId, locators, legalMovesTo, rules, onClick, onLongPress, ...props }) => {
  const itemProps = getPropForItem(description.props, itemId)

  const clicked = useRef(false)
  const onShortClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (clicked.current) {
      if (onClick) {
        onClick(event)
      }
    }
  }, [onClick])

  const bind = useLongPress(() => onLongPress && onLongPress(), {
    cancelOnMovement: true,
    onStart: () => clicked.current = false,
    onCancel: (_, { reason }) => {
      if (reason === LongPressCallbackReason.CancelledByRelease) {
        clicked.current = true
      }
    },
    filterEvents: event => !(event as MouseEvent).button // Ignore clicks on mouse buttons > 0
  })

  switch (description.type) {
    case MaterialComponentType.Board:
      return <Board {...itemProps} onClick={onShortClick} {...bind()} {...props}>
        {description.getLocations ? description.getLocations(itemId, legalMovesTo) : locators && rules && createLocations(rules, locators, itemId, legalMovesTo)}
      </Board>
    case MaterialComponentType.Card:
      return <Card {...itemProps} onClick={onShortClick} {...bind()} {...props}/>
    case MaterialComponentType.Token:
      return <Token {...itemProps} onClick={onShortClick} {...bind()} {...props}/>
    default:
      return null
  }
}

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
