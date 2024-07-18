import { Player, TutorialDescription } from '@gamepark/react-client'
import {
  LocationBuilder,
  Material,
  MaterialGame,
  MaterialGameSetup,
  MaterialMove,
  MaterialMoveRandomized,
  MaterialRules,
  XYCoordinates
} from '@gamepark/rules-api'
import { TFunction } from 'i18next'
import { ReactNode } from 'react'
import { MaterialFocus } from '../material'

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
    game.tutorial = { step: 0, stepComplete: false, popupClosed: false }
    return [game, this.players]
  }

  getNextMove(rules: MaterialRules<P, M, L>) {
    if (rules.game.tutorial && rules.game.tutorial.step < this.steps.length) {
      const step = this.steps[rules.game.tutorial.step]
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
  focus?: (game: MaterialGame<P, M, L>) => Partial<MaterialFocus<P, M, L>>
  move?: {
    player?: P
    filter?: (move: MaterialMove<P, M, L>, game: MaterialGame<P, M, L>) => boolean
    randomize?: (move: MaterialMoveRandomized) => void
    interrupt?: (move: MaterialMove) => boolean
  }
}

export type TutorialPopup = {
  text: (t: TFunction, game: MaterialGame) => string | ReactNode
  position?: Partial<XYCoordinates>
  size?: {
    height?: number,
    width?: number,
  }
}

export function isMaterialTutorial<P extends number = number, M extends number = number, L extends number = number>(
  tutorialDescription?: TutorialDescription<any, any, any>
): tutorialDescription is MaterialTutorial<P, M, L> {
  return !!tutorialDescription && typeof (tutorialDescription as MaterialTutorial).material === 'function'
}

