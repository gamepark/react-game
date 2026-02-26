import { Interpolation, Theme } from '@emotion/react'
import {
  GridBoundaries,
  isMoveItem,
  isMoveItemsAtOnce,
  isMoveItemType,
  isMoveItemTypeAtOnce,
  ItemMove,
  MaterialItem,
  MaterialMove,
  MoveItem,
  MoveItemsAtOnce
} from '@gamepark/rules-api'
import { merge } from 'es-toolkit'
import { useContext, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialContextRefContext, useAnimations, useLegalMoves, useMaterialContext, useUndo } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { gameContext } from '../../GameProvider'
import { MaterialGameAnimations } from '../animations'
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

const DynamicItemsTypeDisplay = ({ type, items, boundaries, ...props }: DynamicItemsTypeDisplayProps) => {
  const game = useContext(gameContext).game
  const context = useMaterialContext()
  const { focus } = useFocusContext()
  const { t } = useTranslation([game, 'common'])
  const description = context.material[type]
  const legalMoves = useLegalMoves<MaterialMove>()
  const [undo, canUndo] = useUndo<MaterialMove>()

  // Stable ref to the latest context — children read from this without subscribing
  const contextRef = useRef(context)
  contextRef.current = context

  // Collect all animations (reveal + item animations are computed here to avoid per-item subscriptions)
  const animationsConfig = useContext(gameContext).animations as MaterialGameAnimations | undefined
  const animations = useAnimations<ItemMove>()
  const revealAnimations = animations.filter(animation =>
    (isMoveItemType(type)(animation.move) && (animation.move as MoveItem).reveal !== undefined)
    || (isMoveItemTypeAtOnce(type)(animation.move) && (animation.move as MoveItemsAtOnce).reveal !== undefined)
  )

  // Pre-compute item animations: build a map of animation CSS per item key
  const itemAnimations = useRef(new Map<string, Interpolation<Theme>>())
  itemAnimations.current.clear()
  if (animations.length && animationsConfig) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      for (let displayIndex = 0; displayIndex < (item.quantity ?? 1); displayIndex++) {
        const itemContext: ItemContext = { ...context, type, index, displayIndex }
        for (const animation of animations) {
          const itemAnimation = animationsConfig.getItemAnimation(itemContext, animation, animation.action, boundaries)
          if (itemAnimation) {
            itemAnimations.current.set(`${index}_${displayIndex}`, itemAnimation)
            break
          }
        }
      }
    }
  }

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
        const animation = itemAnimations.current.get(`${index}_${displayIndex}`)
        return <DraggableMaterial key={`${type}_${index}_${displayIndex}`}
                                  highlight={description.highlight(revealedItem, itemContext)}
                                  type={type} index={index} displayIndex={displayIndex} isFocused={isFocused}
                                  item={revealedItem} disabled={disabled} positionDeps={positionDeps}
                                  legalMoves={legalMoves}
                                  animation={animation}
                                  undo={undo} canUndo={canUndo}
                                  title={description.getTooltip(revealedItem, t, itemContext) ?? undefined}
                                  boundaries={boundaries}
                                  {...props}/>
      })
    })}
  </MaterialContextRefContext.Provider>
}
