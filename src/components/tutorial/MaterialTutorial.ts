import { TutorialDescription } from '@gamepark/react-client'
import { LocationBuilder, Material, MaterialGame, MaterialGameSetup, MaterialItem, MaterialMove, XYCoordinates } from '@gamepark/rules-api'
import { TFunction } from 'i18next'
import { ReactNode } from 'react'

export abstract class MaterialTutorial<P extends number = number, M extends number = number, L extends number = number>
  implements TutorialDescription<MaterialGame<P, M, L>, MaterialMove<P, M, L>> {
  abstract options: any
  abstract setup: MaterialGameSetup<P, M, L>
  abstract steps: TutorialStep<P, M, L>[]

  material(game: MaterialGame<P, M, L>, type: M): Material<P, M, L> {
    return new Material(type, Array.from((game?.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  location(type: L): LocationBuilder<P, L> {
    return new LocationBuilder({ type })
  }

  setupTutorial(): [MaterialGame<P, M, L>, P[]] {
    const game = this.setup.setup(this.options)
    game.tutorialStep = 0
    return [game, game.players]
  }

  expectedMoves(): (MaterialMove<P, M, L>[] | MaterialMove<P, M, L>)[] {
    return []
  }
}

export enum TutorialStepType {
  Popup = 1, Move
}

export enum TutorialFocusType {
  Header = 1
}

export type TutorialStep<P extends number = number, M extends number = number, L extends number = number>
  = TutorialPopupStep<P, M, L> | TutorialMoveStep<P, M, L>

export type TutorialPopupStep<P extends number = number, M extends number = number, L extends number = number> = {
  type: typeof TutorialStepType.Popup
  text: (t: TFunction) => string | ReactNode
  position?: XYCoordinates
  focus?: (game: MaterialGame<P, M, L>) => TutorialFocus<P, M, L>
  zoom?: number
}

export type TutorialFocus<P extends number = number, M extends number = number, L extends number = number> =
  Material<P, M, L> | StaticItem<P, M, L> | LocationBuilder<P, L> | TutorialFocusType

export type TutorialMoveStep<P extends number = number, M extends number = number, L extends number = number> = {
  type: typeof TutorialStepType.Move
  isValidMove?: (move: MaterialMove<P, M, L>) => boolean
  playerId?: P
}

export type StaticItem<P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  item: MaterialItem<P, L>
}

export function isMaterialTutorial(
  tutorialDescription?: TutorialDescription<any, any, any>
): tutorialDescription is MaterialTutorial {
  return !!tutorialDescription && typeof (tutorialDescription as MaterialTutorial).material === 'function'
}

export function isItemFocus(itemType: number, itemIndex: number, focus?: TutorialFocus) {
  return isMaterialFocus(focus) && focus.type === itemType && focus.indexes.includes(itemIndex)
}

export function isMaterialFocus(focus?: TutorialFocus): focus is Material {
  return typeof focus === 'object' && (focus as Material).entries !== undefined
}

export function countTutorialFocusRefs(focus?: TutorialFocus): number {
  if (!focus) return 0
  if (isMaterialFocus(focus)) {
    return focus.getItems().reduce((sum, item) => sum + (item.quantity ?? 1), 0)
  } else if (isStaticItem(focus)) {
    return focus.item.quantity ?? 1
  } else {
    return 0 // TODO
  }
}

export function isStaticItem(focus?: TutorialFocus): focus is StaticItem {
  return typeof focus === 'object' && typeof (focus as any).type === 'number' && typeof (focus as any).item === 'object'
}
