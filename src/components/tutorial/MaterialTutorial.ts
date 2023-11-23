import { Player, TutorialDescription } from '@gamepark/react-client'
import {
  Location,
  LocationBuilder,
  Material,
  MaterialGame,
  MaterialGameSetup,
  MaterialItem,
  MaterialMove,
  MaterialMoveRandomized,
  MaterialRules,
  XYCoordinates
} from '@gamepark/rules-api'
import equal from 'fast-deep-equal'
import { TFunction } from 'i18next'
import sumBy from 'lodash/sumBy'
import { ReactNode } from 'react'

export abstract class MaterialTutorial<P extends number = number, M extends number = number, L extends number = number>
  implements TutorialDescription<MaterialGame<P, M, L>, MaterialMove<P, M, L>> {
  abstract options: any
  abstract setup: MaterialGameSetup<P, M, L>
  abstract steps: TutorialStep<P, M, L>[]
  abstract players: Player<P>[]

  material(game: MaterialGame<P, M, L>, type: M): Material<P, M, L> {
    return new Material(type, Array.from((game?.items[type] ?? []).entries()).filter(entry => entry[1].quantity !== 0))
  }

  location(type: L): LocationBuilder<P, L> {
    return new LocationBuilder({ type })
  }

  setupTutorial(): [MaterialGame<P, M, L>, Player<P>[]] {
    const game = this.setup.setup(this.options)
    game.tutorialStep = 0
    return [game, this.players]
  }

  getNextMove(rules: MaterialRules<P, M, L>) {
    if (rules.game.tutorialStep !== undefined && rules.game.tutorialStep < this.steps.length) {
      const step = this.steps[rules.game.tutorialStep]
      if (!step.move || step.move.player === undefined || step.move.player === rules.game.players[0]) return
      const moves = rules.getLegalMoves(step.move.player)
      return moves[Math.floor(Math.random() * moves.length)]
    }
    return undefined
  }
}

export enum TutorialStepType {
  Popup = 1, Move
}

export type TutorialStepBase = { zoom?: number }

export type TutorialStep<P extends number = number, M extends number = number, L extends number = number> = {
  popup?: TutorialPopup
  focus?: (game: MaterialGame<P, M, L>) => TutorialFocus<P, M, L> | TutorialFocus<P, M, L>[]
  move?: {
    player?: P
    filter?: (move: MaterialMove<P, M, L>, game: MaterialGame<P, M, L>) => boolean
    randomize?: (move: MaterialMoveRandomized) => void
  }
}

export type TutorialPopup = {
  text: (t: TFunction) => string | ReactNode
  position?: XYCoordinates
}

export type TutorialFocus<P extends number = number, M extends number = number, L extends number = number> =
  Material<P, M, L> | StaticItem<P, M, L> | LocationBuilder<P, L>

export type StaticItem<P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  item: MaterialItem<P, L>
}

export function isMaterialTutorial<P extends number = number, M extends number = number, L extends number = number>(
  tutorialDescription?: TutorialDescription<any, any, any>
): tutorialDescription is MaterialTutorial<P, M, L> {
  return !!tutorialDescription && typeof (tutorialDescription as MaterialTutorial).material === 'function'
}

export function isItemFocus(itemType: number, itemIndex: number, focus?: TutorialFocus | TutorialFocus[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isItemFocus(itemType, itemIndex, focus))
  }
  return isMaterialFocus(focus) && focus.type === itemType && focus.getIndexes().includes(itemIndex)
}

export function isMaterialFocus(focus?: TutorialFocus): focus is Material {
  return typeof focus === 'object' && (focus as Material).entries !== undefined
}

export function countTutorialFocusRefs(focus?: TutorialFocus | TutorialFocus[]): number {
  if (!focus) return 0
  if (Array.isArray(focus)) {
    return sumBy(focus, focus => countTutorialFocusRefs(focus))
  }
  if (isMaterialFocus(focus)) {
    return sumBy(focus.getItems(), item => item.quantity ?? 1)
  } else if (isStaticItem(focus)) {
    return focus.item.quantity ?? 1
  } else if (isLocationBuilder(focus)) {
    return 1
  } else {
    return 0
  }
}

export function isStaticItem(focus?: TutorialFocus): focus is StaticItem {
  return typeof focus === 'object' && typeof (focus as any).type === 'number' && typeof (focus as any).item === 'object'
}

export function isStaticItemFocus(itemType: number, item: MaterialItem, focus?: TutorialFocus | TutorialFocus[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isStaticItemFocus(itemType, item, focus))
  }
  return isStaticItem(focus) && focus.type === itemType && equal(focus.item, item)
}

export function isLocationBuilder(focus?: TutorialFocus): focus is LocationBuilder {
  return typeof focus === 'object' && typeof (focus as LocationBuilder).location === 'object'
}

export function isLocationFocus(location: Location, focus?: TutorialFocus | TutorialFocus[]): boolean {
  if (Array.isArray(focus)) {
    return focus.some(focus => isLocationFocus(location, focus))
  }
  return isLocationBuilder(focus) && equal(focus.location, location)
}
