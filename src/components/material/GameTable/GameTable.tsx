/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes, useCallback, useMemo, useState } from 'react'
import { css } from '@emotion/react'
import {
  closeRulesDisplay,
  displayMaterialRules,
  isMoveOnLocation,
  isMoveThisItem,
  MaterialGame,
  MaterialItem,
  MaterialRules,
  MaterialRulesMove
} from '@gamepark/rules-api'
import mapValues from 'lodash.mapvalues'
import pickBy from 'lodash.pickby'
import { DragLayerMonitor } from 'react-dnd'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { MaterialDescription } from '../MaterialDescription'
import { ItemLocator, ItemLocatorCreator, PlaceItemContext } from '../../../locators'
import { fontSizeCss, getPositionTransforms, perspectiveCss, pointerCursorCss, transformCss } from '../../../css'
import { useGame, useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { MaterialComponent } from '../MaterialComponent'
import { DraggableMaterial } from '../DraggableMaterial'
import { RulesDialog } from '../../dialogs'

export type GameTableProps<MaterialType extends number = number, LocationType extends number = number> = {
  material: Record<MaterialType, MaterialDescription>
  locators: Record<LocationType, ItemLocatorCreator>
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zoomMin?: number
  zoomMax?: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
}

export const GameTable: FC<GameTableProps> = (
  { material, locators, xMin, xMax, yMin, yMax, zoomMin = 1, zoomMax = 1, perspective, margin = { left: 0, right: 0, top: 7, bottom: 0 } }
) => {

  const [scale, setScale] = useState(zoomMin / zoomMax)

  return (
    <TransformWrapper minScale={zoomMin / zoomMax} maxScale={1} initialScale={zoomMin / zoomMax} centerOnInit={true} wheel={{ step: 0.05 }}
                      onTransformed={(_, { scale }) => setScale(scale)}>
      <TransformComponent wrapperStyle={{
        position: 'absolute',
        margin: `${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em`,
        transformStyle: 'preserve-3d',
        height: `calc(100vh - ${margin.top + margin.bottom}em)`,
        width: `calc(100vw - ${margin.left + margin.right}em)`,
        overflow: 'visible'
      }}>
        <div css={[tableCss(xMin, xMax, yMin, yMax), fontSizeCss(zoomMax), perspective && perspectiveCss(perspective)]}>
          <GameTableContent locators={locators} material={material} scale={scale}/>
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}

const tableCss = (xMin: number, xMax: number, yMin: number, yMax: number) => css`
  transform-style: preserve-3d;
  width: ${xMax - xMin}em;
  height: ${yMax - yMin}em;

  > * {
    position: absolute;
    top: ${-yMin}em;
    left: ${-xMin}em;
    transform-style: preserve-3d;
  }
`

type GameTableContentProps<P extends number = number, M extends number = number, L extends number = number> = {
  material: Record<M, MaterialDescription>
  locators: Record<L, ItemLocatorCreator<P, M, L>>
  scale?: number
} & HTMLAttributes<HTMLDivElement>


const GameTableContent = ({ material, locators, scale = 1 }: GameTableContentProps) => {
  const game = useGame<MaterialGame>()
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialRulesMove>()
  const play = usePlay()
  const locatorsMap = useMemo(() => mapValues(locators, locator => new locator(material, locators, player)), [])

  /*
   * Very simple projection for draggable to follow the mouse in the 3d environment.
   * The right formula should allow for a custom Z-elevation, and should take all those parameters into account, not only the table scale:
   * - Table rotation (and origin of the rotation)
   * - Origin of the item (and Z-elevation)
   * Though formula with trigonometry to sort out...
   */
  const dragProjection = useCallback((monitor: DragLayerMonitor, locator: ItemLocator, item: MaterialItem, context: PlaceItemContext) => {
    const diff = monitor.getDifferenceFromInitialOffset()
    if (!diff) return diff
    const x = diff.x / scale
    const y = diff.y / scale
    const z = locator.getDragElevation(monitor, item, context)
    return { x, y, z }
  }, [scale])

  if (!game) return <></>

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      if (!description.items) return null
      const type = parseInt(stringType)
      const innerLocators = pickBy(locatorsMap, locator => locator.parentItemType === type)
      const innerLocations = Object.keys(innerLocators).map(type => parseInt(type))
      return description.items(game, player).map((item, index) => {
        const legalMovesTo = innerLocations.length > 0 ? legalMoves.filter(move => isMoveOnLocation(move, innerLocations, rules!, item.id)) : undefined
        return <MaterialComponent key={`${stringType}_${index}`} description={description} itemId={item.id}
                                  locators={innerLocators} legalMovesTo={legalMovesTo} rules={rules!}
                                  css={[pointerCursorCss, transformCss(`translate(-50%, -50%)`, ...getPositionTransforms(item.position, item.rotation))]}
                                  onClick={() => play(displayMaterialRules(type, index, item), { local: true })}/>
      })
    })}
    {game && Object.entries(game.items).map(([stringType, items]) => {
      if (!items) return null
      const type = parseInt(stringType)
      const description = material[type] as MaterialDescription
      return items.map((item, itemIndex) => {
        const locator = locatorsMap[item.location.type]
        return [...Array(item.quantity ?? 1)].map((_, index) => {
          const context: PlaceItemContext = { game, type, index, itemIndex, legalMoves, player }
          if (locator.hide(item, context)) return null
          const itemMoves = legalMoves.filter(move => isMoveThisItem(move, itemIndex, type, rules!))
          return <DraggableMaterial key={`${stringType}_${itemIndex}_${index}`} description={description} type={type} item={item} index={itemIndex}
                                    rules={rules!}
                                    postTransform={locator.place(item, context)}
                                    css={locator.itemExtraCss(item, context)}
                                    projection={monitor => dragProjection(monitor, locator, item, context)}
                                    legalMoves={itemMoves} drop={play}
                                    onClick={() => play(displayMaterialRules(type, itemIndex, item), { local: true })}
                                    onLongPress={() => itemMoves.length === 1 && play(itemMoves[0])}/>
        })
      })
    })}
    <RulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}
                 game={game} legalMoves={legalMoves} rules={rules} material={material} locators={locatorsMap}/>
  </>
}
