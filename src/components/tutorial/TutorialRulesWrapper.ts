import { Action, LocalMoveType, MaterialGame, MaterialMove, MoveKind, RulesCreator, SetTutorialStep } from '@gamepark/rules-api'
import { MaterialTutorial, TutorialStep } from './MaterialTutorial'

export function wrapRulesWithTutorial(tutorial: MaterialTutorial, Rules: RulesCreator<any, any, any>) {

  const getLegalMoves = Rules.prototype.getLegalMoves
  const isTurnToPlay = Rules.prototype.isTurnToPlay
  const canUndo = Rules.prototype.canUndo
  const randomize = Rules.prototype.randomize

  Rules.prototype.getTutorialStep = function (): TutorialStep | undefined {
    return this.game.tutorialStep !== undefined ? tutorial.steps[this.game.tutorialStep] : undefined
  }

  Rules.prototype.isTurnToPlay = function (playerId: any): boolean {
    const game = this.game as MaterialGame
    if (game.tutorialStep === undefined || game.tutorialStep >= tutorial.steps.length) {
      return isTurnToPlay.bind(this)(playerId)
    }
    const tutorialStep = tutorial.steps[game.tutorialStep]
    return playerId === (tutorialStep.move?.player ?? this.game.players[0])
  }

  Rules.prototype.getLegalMoves = function (playerId: any): MaterialMove[] {
    const game = this.game as MaterialGame
    if (game.tutorialStep === undefined || game.tutorialStep >= tutorial.steps.length) {
      return getLegalMoves.bind(this)(playerId)
    }
    const tutorialStep = tutorial.steps[game.tutorialStep]
    if (tutorialStep.move) {
      const player = tutorialStep.move.player ?? this.game.players[0]
      if (playerId !== player) return []
      let legalMoves = getLegalMoves.bind(this)(playerId)
      if (game.tutorialInterrupt?.length) {
        legalMoves = []
      }
      const filter = tutorialStep.move.filter
      if (filter) {
        legalMoves = legalMoves.filter((move: MaterialMove) => filter(move, game))
      }
      if (player === this.game.players[0] && tutorialStep.popup) {
        legalMoves.push({ kind: MoveKind.LocalMove, type: LocalMoveType.CloseTutorialPopup })
      }
      return legalMoves
    } else {
      if (playerId !== this.game.players[0]) return []
      const moves: SetTutorialStep[] = [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 }]
      while (this.game.tutorialStep + moves.length < tutorial.steps.length && !tutorial.steps[this.game.tutorialStep + moves.length].move) {
        moves.push({ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + moves.length + 1 })
      }
      return moves
    }
  }

  const play = Rules.prototype.play

  Rules.prototype.play = function (move: MaterialMove, context?: { local: boolean }) {
    const game = this.game as MaterialGame
    const stepIndex = game.tutorialStep
    const consequences = play.bind(this)(move)
    if (!context?.local && move.kind !== MoveKind.LocalMove && stepIndex !== undefined && stepIndex < tutorial.steps.length) {
      const step = tutorial.steps[stepIndex]
      if (step.move) {
        game.tutorialStepComplete = true
        if (step.move.interrupt) {
          const interruptIndex = consequences.findIndex(step.move.interrupt)
          if (interruptIndex !== -1) {
            this.game.tutorialInterrupt = consequences.slice(interruptIndex)
            consequences.splice(interruptIndex, consequences.length - interruptIndex)
          }
        }
      }
    } else if (move.kind === MoveKind.LocalMove && move.type === LocalMoveType.CloseTutorialPopup) {
      const consequences: MaterialMove[] = this.game.tutorialInterrupt ?? []
      delete this.game.tutorialInterrupt
      if (stepIndex !== undefined) {
        const interrupt = tutorial.steps[stepIndex]?.move?.interrupt
        if (interrupt) {
          const interruptIndex = consequences.findIndex((move, index) => index !== 0 && interrupt(move))
          if (interruptIndex !== -1) {
            this.game.tutorialInterrupt = consequences.slice(interruptIndex)
            consequences.splice(interruptIndex, consequences.length - interruptIndex)
          }
        }
      }
      return consequences
    }
    return consequences
  }

  const getAutomaticMoves = Rules.prototype.getAutomaticMoves

  Rules.prototype.getAutomaticMoves = function () {
    const consequences = getAutomaticMoves.bind(this)() as MaterialMove[]
    if (!consequences.length && (this.game as MaterialGame).tutorialStepComplete) {
      return [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 }]
    }
    return consequences
  }

  Rules.prototype.canUndo = function (action: Action, consecutiveActions: Action[]) {
    const game = this.game as MaterialGame
    if (game.tutorialStep !== undefined && game.tutorialStep < tutorial.steps.length && consecutiveActions.length) {
      // It is forbidden to undo any move but the very last one during the tutorial
      return false
    }
    return canUndo.bind(this)(action, consecutiveActions)
  }

  Rules.prototype.randomize = function (move: MaterialMove) {
    const game = this.game as MaterialGame
    const moveRandomized = randomize.bind(this)(move)
    if (game.tutorialStep !== undefined && game.tutorialStep < tutorial.steps.length) {
      const tutorialStep = tutorial.steps[game.tutorialStep]
      if (tutorialStep.move?.randomize) {
        tutorialStep.move?.randomize(moveRandomized)
      }
    }
    return moveRandomized
  }
}
