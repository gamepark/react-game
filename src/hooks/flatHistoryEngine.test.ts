import { describe, expect, it } from 'vitest'
import {
  buildActionMap,
  Checkpoint,
  CHECKPOINT_INTERVAL,
  HistoryEngine,
  LogContext,
  playMoveOnEngine,
  processMovesSync,
  replayFromCheckpoint,
  saveCheckpointIfNeeded
} from './flatHistoryEngine'

// --- Minimal mock Rules class ---
// game = { value: number }, play() increments value by move.data
class MockRules {
  game: { value: number }

  constructor(game: any, _options?: any) {
    this.game = game
  }

  play(move: any, _options?: any) {
    this.game.value += move.data
    return []
  }
}

const makeAction = (id: string, local?: boolean) => ({ id, playerId: 1, local } as any)

const makePlayedMove = (actionId: string, data: number, consequenceIndex?: number) => ({
  actionId,
  move: { data },
  consequenceIndex
})

const DummyComponent = () => null

const makeLogContext = (overrides?: Partial<LogContext>): LogContext => {
  const actions = new Map<string, any>()
  return {
    logs: {
      getMovePlayedLogDescription: (_move: any, _ctx: any) => ({
        Component: DummyComponent
      })
    },
    RulesClass: MockRules as any,
    setup: { value: 0 },
    gameOver: undefined,
    player: 1,
    getAction: (id: string) => actions.get(id),
    ...overrides
  }
}

const makeEngine = (initialValue = 0): HistoryEngine => ({
  rules: new MockRules({ value: initialValue }) as any,
  checkpoints: [],
  movesProcessed: 0
})

// ============================================================
// replayFromCheckpoint
// ============================================================
describe('replayFromCheckpoint', () => {
  it('replays from setup when no checkpoints', () => {
    const playedMoves = [
      makePlayedMove('a1', 10),
      makePlayedMove('a2', 20),
      makePlayedMove('a3', 5)
    ]
    const actions = new Map([['a1', makeAction('a1')], ['a2', makeAction('a2')], ['a3', makeAction('a3')]])
    const getAction = (id: string) => actions.get(id)

    const result = replayFromCheckpoint(
      3, [], playedMoves,
      MockRules as any, { value: 0 }, undefined, 1, getAction
    )
    expect(result.value).toBe(35) // 0 + 10 + 20 + 5
  })

  it('replays from nearest checkpoint', () => {
    const playedMoves = [
      makePlayedMove('a1', 10),
      makePlayedMove('a2', 20),
      makePlayedMove('a3', 5),
      makePlayedMove('a4', 15)
    ]
    const actions = new Map([
      ['a1', makeAction('a1')], ['a2', makeAction('a2')],
      ['a3', makeAction('a3')], ['a4', makeAction('a4')]
    ])
    const getAction = (id: string) => actions.get(id)

    const checkpoints: Checkpoint[] = [
      { moveIndex: 2, gameState: { value: 30 } } // after moves 0,1
    ]

    const result = replayFromCheckpoint(
      4, checkpoints, playedMoves,
      MockRules as any, { value: 0 }, undefined, 1, getAction
    )
    // from checkpoint (value=30), replay moves 2,3: 30 + 5 + 15 = 50
    expect(result.value).toBe(50)
  })

  it('picks the closest checkpoint, not the first', () => {
    const playedMoves = Array.from({ length: 6 }, (_, i) => makePlayedMove(`a${i}`, 10))
    const actions = new Map(playedMoves.map((m) => [m.actionId, makeAction(m.actionId)]))
    const getAction = (id: string) => actions.get(id)

    const checkpoints: Checkpoint[] = [
      { moveIndex: 2, gameState: { value: 20 } },
      { moveIndex: 4, gameState: { value: 40 } }
    ]

    const result = replayFromCheckpoint(
      6, checkpoints, playedMoves,
      MockRules as any, { value: 0 }, undefined, 1, getAction
    )
    // from checkpoint at 4 (value=40), replay moves 4,5: 40 + 10 + 10 = 60
    expect(result.value).toBe(60)
  })

  it('returns deep clone (not a reference)', () => {
    const playedMoves = [makePlayedMove('a1', 10)]
    const actions = new Map([['a1', makeAction('a1')]])
    const getAction = (id: string) => actions.get(id)

    const result1 = replayFromCheckpoint(1, [], playedMoves, MockRules as any, { value: 0 }, undefined, 1, getAction)
    const result2 = replayFromCheckpoint(1, [], playedMoves, MockRules as any, { value: 0 }, undefined, 1, getAction)

    result1.value = 999
    expect(result2.value).toBe(10) // not affected
  })

  it('does not mutate checkpoint gameState', () => {
    const playedMoves = [makePlayedMove('a1', 10), makePlayedMove('a2', 20)]
    const actions = new Map([['a1', makeAction('a1')], ['a2', makeAction('a2')]])
    const getAction = (id: string) => actions.get(id)

    const checkpoint: Checkpoint = { moveIndex: 1, gameState: { value: 10 } }

    replayFromCheckpoint(2, [checkpoint], playedMoves, MockRules as any, { value: 0 }, undefined, 1, getAction)

    expect(checkpoint.gameState.value).toBe(10) // unchanged
  })
})

// ============================================================
// saveCheckpointIfNeeded
// ============================================================
describe('saveCheckpointIfNeeded', () => {
  it('saves checkpoint at interval boundaries', () => {
    const engine = makeEngine(100)

    saveCheckpointIfNeeded(engine, CHECKPOINT_INTERVAL)

    expect(engine.checkpoints).toHaveLength(1)
    expect(engine.checkpoints[0].moveIndex).toBe(CHECKPOINT_INTERVAL)
    expect(engine.checkpoints[0].gameState.value).toBe(100)
  })

  it('does not save checkpoint at non-interval indices', () => {
    const engine = makeEngine(100)

    saveCheckpointIfNeeded(engine, 1)
    saveCheckpointIfNeeded(engine, 13)
    saveCheckpointIfNeeded(engine, CHECKPOINT_INTERVAL - 1)

    expect(engine.checkpoints).toHaveLength(0)
  })

  it('does not save checkpoint at index 0', () => {
    const engine = makeEngine(0)

    saveCheckpointIfNeeded(engine, 0)

    expect(engine.checkpoints).toHaveLength(0)
  })

  it('saves deep clone of game state', () => {
    const engine = makeEngine(42)

    saveCheckpointIfNeeded(engine, CHECKPOINT_INTERVAL)
    ;(engine.rules as any).game.value = 999

    expect(engine.checkpoints[0].gameState.value).toBe(42) // not mutated
  })
})

// ============================================================
// playMoveOnEngine
// ============================================================
describe('playMoveOnEngine', () => {
  it('applies move to engine rules', () => {
    const engine = makeEngine(0)
    const actions = new Map([['a1', makeAction('a1')]])

    playMoveOnEngine(engine, makePlayedMove('a1', 25), (id) => actions.get(id))

    expect((engine.rules as any).game.value).toBe(25)
  })

  it('passes local flag from action', () => {
    let receivedOptions: any = null
    class SpyRules extends MockRules {
      play(move: any, options?: any) {
        receivedOptions = options
        return super.play(move, options)
      }
    }

    const engine: HistoryEngine = {
      rules: new SpyRules({ value: 0 }) as any,
      checkpoints: [],
      movesProcessed: 0
    }
    const actions = new Map([['a1', makeAction('a1', true)]])

    playMoveOnEngine(engine, makePlayedMove('a1', 5), (id) => actions.get(id))

    expect(receivedOptions).toEqual({ local: true })
  })

  it('does not throw on error, logs to console', () => {
    class FailRules extends MockRules {
      play() {
        throw new Error('boom')
        return []
      }
    }

    const engine: HistoryEngine = {
      rules: new FailRules({ value: 0 }) as any,
      checkpoints: [],
      movesProcessed: 0
    }
    const actions = new Map([['a1', makeAction('a1')]])

    // Should not throw
    expect(() => playMoveOnEngine(engine, makePlayedMove('a1', 5), (id) => actions.get(id))).not.toThrow()
  })
})

// ============================================================
// buildActionMap
// ============================================================
describe('buildActionMap', () => {
  it('builds map from actions array', () => {
    const actions = [makeAction('a1'), makeAction('a2'), makeAction('a3')]
    const map = buildActionMap(actions)

    expect(map.size).toBe(3)
    expect(map.get('a1')).toBe(actions[0])
    expect(map.get('a2')).toBe(actions[1])
    expect(map.get('a3')).toBe(actions[2])
  })

  it('returns empty map for undefined', () => {
    const map = buildActionMap(undefined)
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty array', () => {
    const map = buildActionMap([])
    expect(map.size).toBe(0)
  })

  it('lookup is O(1) vs find O(n)', () => {
    const n = 1000
    const actions = Array.from({ length: n }, (_, i) => makeAction(`action_${i}`))
    const map = buildActionMap(actions)

    // Just verify correctness — performance is structural
    expect(map.get('action_0')?.id).toBe('action_0')
    expect(map.get('action_999')?.id).toBe('action_999')
    expect(map.get('nonexistent')).toBeUndefined()
  })
})

// ============================================================
// processMovesSync
// ============================================================
describe('processMovesSync', () => {
  it('processes moves and returns entries with correct game states', () => {
    const playedMoves = [
      makePlayedMove('a1', 10),
      makePlayedMove('a2', 20),
      makePlayedMove('a3', 5)
    ]
    const actions = new Map(playedMoves.map((m) => [m.actionId, makeAction(m.actionId)]))

    const ctx = makeLogContext({
      getAction: (id) => actions.get(id),
      logs: {
        getMovePlayedLogDescription: (move: any, context: any) => {
          // Access game to test eager evaluation path
          void context.game
          return { Component: DummyComponent }
        }
      }
    })

    const engine = makeEngine(0)
    const entries = processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    expect(entries).toHaveLength(3)
    // Each entry.game should reflect the state BEFORE that move was played
    expect(entries[0].game.value).toBe(0)   // before first move
    expect(entries[1].game.value).toBe(10)  // after first move
    expect(entries[2].game.value).toBe(30)  // after second move
  })

  it('filters out moves without log description', () => {
    const playedMoves = [
      makePlayedMove('a1', 10),
      makePlayedMove('a2', 20), // this one will have no description
      makePlayedMove('a3', 5)
    ]
    const actions = new Map(playedMoves.map((m) => [m.actionId, makeAction(m.actionId)]))

    const ctx = makeLogContext({
      getAction: (id) => actions.get(id),
      logs: {
        getMovePlayedLogDescription: (move: any) => {
          if (move.data === 20) return undefined
          return { Component: DummyComponent }
        }
      }
    })

    const engine = makeEngine(0)
    const entries = processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    expect(entries).toHaveLength(2)
    // Engine still advanced through all 3 moves
    expect((engine.rules as any).game.value).toBe(35)
  })

  it('creates checkpoints during processing', () => {
    const n = CHECKPOINT_INTERVAL + 10
    const playedMoves = Array.from({ length: n }, (_, i) => makePlayedMove(`a${i}`, 1))
    const actions = new Map(playedMoves.map((m) => [m.actionId, makeAction(m.actionId)]))

    const ctx = makeLogContext({ getAction: (id) => actions.get(id) })
    const engine = makeEngine(0)

    processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    expect(engine.checkpoints).toHaveLength(1)
    expect(engine.checkpoints[0].moveIndex).toBe(CHECKPOINT_INTERVAL)
    expect(engine.checkpoints[0].gameState.value).toBe(CHECKPOINT_INTERVAL)
  })

  it('lazy game getter replays correctly from checkpoints', () => {
    const n = CHECKPOINT_INTERVAL + 5
    const playedMoves = Array.from({ length: n }, (_, i) => makePlayedMove(`a${i}`, 1))
    const actions = new Map(playedMoves.map((m) => [m.actionId, makeAction(m.actionId)]))

    // Don't access context.game in getMovePlayedLogDescription → lazy path
    const ctx = makeLogContext({ getAction: (id) => actions.get(id) })
    const engine = makeEngine(0)

    const entries = processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    // Access the last entry's game — should trigger lazy replay from checkpoint
    const lastEntry = entries[entries.length - 1]
    const lastMoveIndex = n - 1
    expect(lastEntry.game.value).toBe(lastMoveIndex) // state before last move
  })

  it('handles empty moves array', () => {
    const ctx = makeLogContext()
    const engine = makeEngine(0)
    const entries = processMovesSync([], 0, engine, [], ctx)

    expect(entries).toHaveLength(0)
    expect((engine.rules as any).game.value).toBe(0)
  })

  it('handles moves with missing actions gracefully', () => {
    const playedMoves = [makePlayedMove('unknown', 10)]
    const ctx = makeLogContext({ getAction: () => undefined })
    const engine = makeEngine(0)

    const entries = processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    expect(entries).toHaveLength(0)
  })

  it('preserves consequenceIndex in entries', () => {
    const playedMoves = [
      makePlayedMove('a1', 10, undefined),
      makePlayedMove('a1', 5, 0),
      makePlayedMove('a1', 3, 1)
    ]
    const actions = new Map([['a1', makeAction('a1')]])
    const ctx = makeLogContext({ getAction: (id) => actions.get(id) })
    const engine = makeEngine(0)

    const entries = processMovesSync(playedMoves, 0, engine, playedMoves, ctx)

    expect(entries[0].consequenceIndex).toBeUndefined()
    expect(entries[1].consequenceIndex).toBe(0)
    expect(entries[2].consequenceIndex).toBe(1)
  })
})
