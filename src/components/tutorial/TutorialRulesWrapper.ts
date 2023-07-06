import { LocalMoveType, MaterialGame, MaterialMove, MoveKind, RulesCreator, SetTutorialStep } from '@gamepark/rules-api'
import { MaterialTutorial, TutorialStep } from './MaterialTutorial'

export function wrapRulesWithTutorial(tutorial: MaterialTutorial, Rules: RulesCreator<any, any, any>) {

  const getLegalMoves = Rules.prototype.getLegalMoves

  Rules.prototype.getTutorialStep = function (): TutorialStep | undefined {
    return this.game.tutorialStep !== undefined ? tutorial.steps[this.game.tutorialStep] : undefined
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

  Rules.prototype.play = function (move: MaterialMove) {
    const game = this.game as MaterialGame
    const step = game.tutorialStep
    if (move.kind !== MoveKind.LocalMove && step !== undefined && step < tutorial.steps.length && tutorial.steps[step].move) {
      game.tutorialStepComplete = true
    }
    return play.bind(this)(move)
  }

  const getAutomaticMoves = Rules.prototype.getAutomaticMoves

  Rules.prototype.getAutomaticMoves = function () {
    const consequences = getAutomaticMoves.bind(this)() as MaterialMove[]
    if (!consequences.length && (this.game as MaterialGame).tutorialStepComplete) {
      return [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 }]
    }
    return consequences
  }
}
