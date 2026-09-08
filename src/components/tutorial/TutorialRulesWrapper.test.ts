// @ts-nocheck
import {
  LocalMoveType,
  MaterialGame,
  MaterialGameSetup,
  MaterialRules,
  MoveKind,
  playAction,
  PlayerTurnRule,
  SetTutorialStep
} from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { MaterialTutorial } from './MaterialTutorial'
import { wrapRulesWithTutorial } from './TutorialRulesWrapper'

/** A game where each player, in turn, has exactly one move to play, which is all a tutorial step ever waits for. */
class TurnRule extends PlayerTurnRule {
  getPlayerMoves() {
    return [this.customMove(1)]
  }

  onCustomMove() {
    return [this.startPlayerTurn(1, this.nextPlayer)]
  }
}

class TestRules extends MaterialRules {
  rules = { 1: TurnRule }
}

class TestSetup extends MaterialGameSetup {
  Rules = TestRules

  setupMaterial() {}

  /** The opponent opens, they being the one the tutorial has a step waiting for. */
  start() {
    this.startPlayerTurn(1, 2)
  }
}

const popup = { text: () => '' }

/** The shape every tutorial has: a popup the reader clicks through, then a move their opponent plays. */
class TestTutorial extends MaterialTutorial {
  options = { players: 2 }
  setup = new TestSetup()
  players = [{ id: 1 }, { id: 2 }]
  steps = [{ popup }, { move: { player: 2 } }, { popup }]
}

const tutorial = new TestTutorial()
wrapRulesWithTutorial(tutorial, TestRules)

const setTutorialStep = (step: number): SetTutorialStep => ({ kind: MoveKind.LocalMove, type: LocalMoveType.SetTutorialStep, step })

const startTutorial = (): TestRules => {
  const [game] = tutorial.setupTutorial()
  return new TestRules(game as MaterialGame)
}

describe('A tutorial', () => {
  it('goes to the step the popup button asks for', () => {
    const rules = startTutorial()
    playAction(rules, setTutorialStep(1), 1)
    expect(rules.game.tutorial!.step).toBe(1)
  })

  it('moves on to the next step once the opponent has played theirs', () => {
    const rules = startTutorial()
    playAction(rules, setTutorialStep(1), 1)
    playAction(rules, rules.getLegalMoves(2)[0], 2)
    expect(rules.game.tutorial!.step).toBe(2)
  })

  // The popup button is still on screen, holding the step it was rendered with, while the game has moved on:
  // a double click, or a click on a device slow enough to render the next step after the 300ms the button
  // guards itself with. Played, that step would wait for a move the opponent has already played, and no player
  // would have anything left to play (see {@link wrapRulesWithTutorial}).
  it('never goes back to a step it has left, whatever a popup button played twice asks for', () => {
    const rules = startTutorial()
    playAction(rules, setTutorialStep(1), 1)
    playAction(rules, rules.getLegalMoves(2)[0], 2)
    playAction(rules, setTutorialStep(1), 1)
    expect(rules.game.tutorial!.step).toBe(2)
    expect(rules.getLegalMoves(1).length).toBeGreaterThan(0)
  })

  it('stays where it is when the very step it is on is asked for again', () => {
    const rules = startTutorial()
    playAction(rules, setTutorialStep(1), 1)
    playAction(rules, setTutorialStep(1), 1)
    expect(rules.game.tutorial!.step).toBe(1)
    expect(rules.getLegalMoves(2).length).toBeGreaterThan(0)
  })
})
