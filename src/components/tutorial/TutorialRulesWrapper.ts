import { LocalMoveType, MaterialMove, MoveKind, RulesCreator, SetTutorialStep } from '@gamepark/rules-api'
import { MaterialTutorial, TutorialStep, TutorialStepType } from './MaterialTutorial'
import equal from 'fast-deep-equal'

export function wrapRulesWithTutorial(tutorial: MaterialTutorial, Rules: RulesCreator<any, any, any>) {

  const getLegalMoves = Rules.prototype.getLegalMoves

  Rules.prototype.getTutorialStep = function (): TutorialStep | undefined {
    return this.game.tutorialStep !== undefined ? tutorial.steps[this.game.tutorialStep] : undefined
  }

  Rules.prototype.getLegalMoves = function (playerId: any): MaterialMove[] {
    const step = this.getTutorialStep()
    switch (step?.type) {
      case TutorialStepType.Popup:
        if (playerId !== this.game.players[0]) return []
        const moves: SetTutorialStep[] = [{ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 }]
        while (tutorial.steps[this.game.tutorialStep + moves.length]?.type === TutorialStepType.Popup) {
          moves.push({ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 + moves.length })
        }
        return moves
      case TutorialStepType.Move:
        if ((step.playerId ?? this.game.players[0]) !== playerId) return []
        return getLegalMoves.bind(this)(playerId).filter((move: MaterialMove) => step.isValidMove?.(move) ?? true)
      default:
        return getLegalMoves.bind(this)(playerId)
    }
  }

  const play = Rules.prototype.play

  Rules.prototype.play = function (move: MaterialMove): MaterialMove[] {
    const step = this.getTutorialStep() as TutorialStep | undefined
    const tutorialForward = step?.type === TutorialStepType.Move
      && this.getLegalMoves(step.playerId ?? this.game.players[0]).some((legalMove: MaterialMove) => equal(move, legalMove))

    const consequences = play.bind(this)(move) as MaterialMove[]
    if (tutorialForward) {
      consequences.push({ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step: this.game.tutorialStep + 1 })
    }
    return consequences
  }
}
