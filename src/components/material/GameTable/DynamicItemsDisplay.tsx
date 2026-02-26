import { Interpolation, Theme } from '@emotion/react'
import {
  GridBoundaries,
  isMoveItem,
  isMoveItemsAtOnce,
  isMoveItemType,
  isMoveItemTypeAtOnce,
  MaterialItem,
  MaterialMove,
  MoveItem,
  MoveItemsAtOnce
} from '@gamepark/rules-api'
import { merge } from 'es-toolkit'
import { useContext, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialContextRefContext, useAnimations, useLegalMoves, useMaterialContext } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { gameContext } from '../../GameProvider'
import { DraggableMaterial } from '../DraggableMaterial'
import { useFocusContext } from './focus'

export const DynamicItemsDisplay = ({ boundaries }: { boundaries: GridBoundaries }) => {
  const context = useMaterialContext()
  const items = context.rules.game.items
  return <>
    {Object.entries(items).map(([stringType, items]) =>
      items && <DynamicItemsTypeDisplay key={stringType} type={parseInt(stringType)} items={items} boundaries={boundaries}/>
    )}
  </>
}

type DynamicItemsTypeDisplayProps = {
  type: number
  items: MaterialItem[]
  boundaries: GridBoundaries
  css?: Interpolation<Theme>
}

const DynamicItemsTypeDisplay = ({ type, items, ...props }: DynamicItemsTypeDisplayProps) => {
  const game = useContext(gameContext).game
  const context = useMaterialContext()
  const { focus } = useFocusContext()
  const { t } = useTranslation([game, 'common'])
  const description = context.material[type]
  const legalMoves = useLegalMoves<MaterialMove>()

  // Stable ref to the latest context — children read from this without subscribing
  const contextRef = useRef(context)
  contextRef.current = context

  // Collect all reveal animations for this material type
  const revealAnimations = useAnimations<MoveItem | MoveItemsAtOnce>(animation =>
    (isMoveItemType(type)(animation.move) && animation.move.reveal !== undefined)
    || (isMoveItemTypeAtOnce(type)(animation.move) && animation.move.reveal !== undefined)
  )

  if (!description) return null
  return <MaterialContextRefContext.Provider value={contextRef}>
    {items.map((item, index) => {
      // Apply reveal data from active animation matching this specific item
      let revealedItem = item
      for (const animation of revealAnimations) {
        const move = animation.move
        const reveal = isMoveItem(move) && move.itemIndex === index
          ? move.reveal
          : isMoveItemsAtOnce(move) ? move.reveal?.[index] : undefined
        if (reveal) {
          revealedItem = merge(JSON.parse(JSON.stringify(item)), reveal)
          break
        }
      }

      return [...Array(item.quantity ?? 1)].map((_, displayIndex) => {
        const itemContext: ItemContext = { ...context, type, index, displayIndex }
        const locator = context.locators[revealedItem.location.type]
        if (locator?.ignore(revealedItem, itemContext)) return null
        const isFocused = focus?.materials.some(material =>
          material.type === type && material.getIndexes().includes(index)
        )
        const disabled = !legalMoves.some(move => description.canDrag(move, itemContext))
        const positionDeps = locator?.getFullPositionDependencies(revealedItem.location, context)
        return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                  highlight={description.highlight(revealedItem, itemContext)}
                                  type={type} index={index} displayIndex={displayIndex} isFocused={isFocused}
                                  item={revealedItem} disabled={disabled} positionDeps={positionDeps}
                                  legalMoves={legalMoves}
                                  title={description.getTooltip(revealedItem, t, itemContext) ?? undefined}
                                  {...props}/>
      })
    })}
  </MaterialContextRefContext.Provider>
}
