import { Action, LocalMoveType, MaterialGame, MaterialMove, MoveKind, PlayMoveContext, RulesCreator, SetTutorialStep } from '@gamepark/rules-api'
import { MaterialTutorial, TutorialStep } from './MaterialTutorial'

export function wrapRulesWithTutorial(tutorial: MaterialTutorial, Rules: RulesCreator<any, any, any>) {

  const isLegalMove = Rules.prototype.isLegalMove
  const getLegalMoves = Rules.prototype.getLegalMoves
  const isTurnToPlay = Rules.prototype.isTurnToPlay
  const canUndo = Rules.prototype.canUndo
  const randomize = Rules.prototype.randomize

  Rules.prototype.getTutorialStep = function (): TutorialStep | undefined {
    return this.game.tutorial ? tutorial.steps[this.game.tutorial.step] : undefined
  }

  Rules.prototype.isTurnToPlay = function (playerId: any): boolean {
    const game = this.game as MaterialGame
    if (!game.tutorial || game.tutorial.step >= tutorial.steps.length) {
      return isTurnToPlay.bind(this)(playerId)
    }
    const tutorialStep = tutorial.steps[game.tutorial.step]
    return playerId === (tutorialStep.move?.player ?? this.game.players[0])
  }

  Rules.prototype.isLegalMove = function (playerId: any, move: MaterialMove): boolean {
    if (move.kind === MoveKind.LocalMove) return true
    const game = this.game as MaterialGame
    if (game.tutorial && game.tutorial.step < tutorial.steps.length) {
      const tutorialStep = tutorial.steps[game.tutorial.step]
      if (!tutorialStep.move || (tutorialStep.move?.filter && !tutorialStep.move.filter(move, game))) {
        return false
      }
    }
    return isLegalMove.bind(this)(playerId, move)
  }

  Rules.prototype.getLegalMoves = function (playerId: any): MaterialMove[] {
    const game = this.game as MaterialGame
    if (!game.tutorial || game.tutorial.step >= tutorial.steps.length) {
      return getLegalMoves.bind(this)(playerId)
    }
    const tutorialStep = tutorial.steps[game.tutorial.step]
    if (tutorialStep.move) {
      const player = tutorialStep.move.player ?? this.game.players[0]
      if (playerId !== player) return []
      let legalMoves = getLegalMoves.bind(this)(playerId)
      if (game.tutorial.interrupt?.length) {
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
      const moves: SetTutorialStep[] = [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorial.step + 1 }]
      while (this.game.tutorial.step + moves.length < tutorial.steps.length && !tutorial.steps[this.game.tutorial.step + moves.length].move) {
        moves.push({ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorial.step + moves.length + 1 })
      }
      return moves
    }
  }

  const play = Rules.prototype.play

  Rules.prototype.play = function (move: MaterialMove, context?: PlayMoveContext) {
    const game = this.game as MaterialGame
    const consequences = play.bind(this)(move, context)
    if (!context?.local && move.kind !== MoveKind.LocalMove && game.tutorial && game.tutorial.step < tutorial.steps.length) {
      const step = tutorial.steps[game.tutorial.step]
      if (step.move) {
        game.tutorial.stepComplete = true
        if (step.move.interrupt) {
          const interruptIndex = consequences.findIndex(step.move.interrupt)
          if (interruptIndex !== -1) {
            this.game.tutorial.interrupt = consequences.slice(interruptIndex)
            consequences.splice(interruptIndex, consequences.length - interruptIndex)
          }
        }
      }
    } else if (move.kind === MoveKind.LocalMove && move.type === LocalMoveType.CloseTutorialPopup) {
      const consequences: MaterialMove[] = this.game.tutorial.interrupt ?? []
      delete this.game.tutorial.interrupt
      if (game.tutorial) {
        const interrupt = tutorial.steps[game.tutorial.step]?.move?.interrupt
        if (interrupt) {
          const interruptIndex = consequences.findIndex((move, index) => index !== 0 && interrupt(move))
          if (interruptIndex !== -1) {
            this.game.tutorial.interrupt = consequences.slice(interruptIndex)
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
    if (!consequences.length && (this.game as MaterialGame).tutorial?.stepComplete) {
      return [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorial.step + 1 }]
    }
    return consequences
  }

  Rules.prototype.canUndo = function (action: Action, consecutiveActions: Action[]) {
    const game = this.game as MaterialGame
    if (game.tutorial && game.tutorial.step < tutorial.steps.length && consecutiveActions.length) {
      // It is forbidden to undo any move but the very last one during the tutorial
      return false
    }
    return canUndo.bind(this)(action, consecutiveActions)
  }

  Rules.prototype.randomize = function (move: MaterialMove) {
    const game = this.game as MaterialGame
    const moveRandomized = randomize.bind(this)(move)
    if (game.tutorial && game.tutorial.step < tutorial.steps.length) {
      const tutorialStep = tutorial.steps[game.tutorial.step]
      if (tutorialStep.move?.randomize) {
        tutorialStep.move?.randomize(moveRandomized)
      }
    }
    return moveRandomized
  }
}
