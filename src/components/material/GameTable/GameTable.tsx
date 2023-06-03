/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes, useCallback, useContext, useMemo, useState } from 'react'
import { css } from '@emotion/react'
import { closeRulesDisplay, displayMaterialRules, Location, MaterialGame, MaterialRules, MaterialRulesMove } from '@gamepark/rules-api'
import mapValues from 'lodash.mapvalues'
import pickBy from 'lodash.pickby'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { MaterialDescription } from '../MaterialDescription'
import { ItemLocatorCreator, PlaceItemContext } from '../../../locators'
import { fontSizeCss, getPositionTransforms, perspectiveCss, pointerCursorCss, transformCss } from '../../../css'
import { useGame, useLegalMoves, usePlay, usePlayerId, useRules } from '../../../hooks'
import { MaterialComponent } from '../MaterialComponent'
import { DraggableMaterial } from '../DraggableMaterial'
import { RulesDialog } from '../../dialogs'
import { DndContext, DragEndEvent, getClientRect } from '@dnd-kit/core'
import { gameContext } from '../../../../../workshop/packages/react-client'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { isMoveItem, isMoveItemToLocation, isMoveOnItem } from '../utils'

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

const wheel = { step: 0.05 }
const doubleClick = { disabled: true }

export const GameTable: FC<GameTableProps> = (
  { material, locators, xMin, xMax, yMin, yMax, zoomMin = 1, zoomMax = 1, perspective, margin = { left: 0, right: 0, top: 7, bottom: 0 } }
) => {

  const context = useContext(gameContext)
  if (!context.scale) {
    context.scale = zoomMin / zoomMax
  }

  const [dragging, setDragging] = useState(false)

  const play = usePlay()
  const rules = useRules<MaterialRules>()!
  const legalMoves = useLegalMoves()
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(false)
    if (event.active.data.current && event.over?.data.current) {
      const { type, index } = event.active.data.current
      const moves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveItemToLocation(move, type, index, event.over?.data.current as Location)))
      if (moves.length === 1) {
        play(moves[0], { delayed: rules.isUnpredictableMove(moves[0]) })
      }
    }
  }, [play, rules, legalMoves])

  return (
    <DndContext measuring={{ draggable: { measure: getClientRect }, droppable: { measure: getClientRect } }} modifiers={[snapCenterToCursor]}
                onDragStart={() => setDragging(true)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      <TransformWrapper minScale={zoomMin / zoomMax} maxScale={1} initialScale={zoomMin / zoomMax} centerOnInit={true} wheel={wheel}
                        onTransformed={(_, { scale }) => context.scale = scale} panning={{ disabled: dragging }} disablePadding doubleClick={doubleClick}>
        <TransformComponent wrapperStyle={{
          position: 'absolute',
          margin: `${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em`,
          transformStyle: 'preserve-3d',
          height: `calc(100% - ${margin.top + margin.bottom}em)`,
          width: `calc(100% - ${margin.left + margin.right}em)`,
          overflow: 'visible'
        }}>
          <div css={[tableCss(xMin, xMax, yMin, yMax), fontSizeCss(zoomMax), perspective && perspectiveCss(perspective)]}>
            <GameTableContent locators={locators} material={material}/>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </DndContext>
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
} & HTMLAttributes<HTMLDivElement>


const GameTableContent = ({ material, locators }: GameTableContentProps) => {
  const game = useGame<MaterialGame>()
  const player = usePlayerId()
  const rules = useRules<MaterialRules>()
  const legalMoves = useLegalMoves<MaterialRulesMove>()
  const play = usePlay()
  const locatorsMap = useMemo(() => mapValues(locators, locator => new locator(material, locators, player)), [])

  if (!game || !rules) return <></>

  return <>
    {Object.entries(material).map(([stringType, description]) => {
      if (!description.items) return null
      const type = parseInt(stringType)
      const innerLocators = pickBy(locatorsMap, locator => locator.parentItemType === type)
      const innerLocations = Object.keys(innerLocators).map(type => parseInt(type))
      return description.items(game, player).map((item, index) => {
        const legalMovesTo = innerLocations.length > 0 ? legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveOnItem(move, item.id, innerLocations))) : undefined
        return <MaterialComponent key={`${stringType}_${index}`} description={description} itemId={item.id}
                                  locators={innerLocators} legalMovesTo={legalMovesTo} rules={rules}
                                  css={[pointerCursorCss, transformCss(`translate(-50%, -50%)`, ...getPositionTransforms(item.position, item.rotation))]}
                                  onShortClick={() => play(displayMaterialRules(type, index, item), { local: true })}/>
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
          const itemMoves = legalMoves.filter(move => rules.isMoveTrigger(move, move => isMoveItem(move, type, itemIndex)))
          return <DraggableMaterial key={`${type}_${itemIndex}_${index}`}
                                    id={`${type}_${itemIndex}_${index}`}
                                    data={{ item, type, index: itemIndex }}
                                    disabled={!itemMoves.length}
                                    preTransform="translate(-50%, -50%)"
                                    postTransform={locator.place(item, context)}
                                    rules={rules}
                                    description={description}
                                    css={locator.itemExtraCss(item, context)}
                                    onShortClick={() => play(displayMaterialRules(type, itemIndex, item), { local: true })}
                                    onLongClick={itemMoves.length === 1 ? () => play(itemMoves[0]) : undefined}/>
        })
      })
    })}
    <RulesDialog open={!!game?.rulesDisplay} close={() => play(closeRulesDisplay, { local: true })}
                 game={game} legalMoves={legalMoves} rules={rules} material={material} locators={locatorsMap}/>
  </>
}
