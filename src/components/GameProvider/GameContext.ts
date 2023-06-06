import { TutorialDescription } from '@gamepark/react-client'
import { RulesCreator } from '@gamepark/rules-api'
import React from 'react'

export type GameContext<Game = any, Move = any, PlayerId = any> = {
  game: string
  Rules: RulesCreator<Game, Move, PlayerId>
  optionsSpec?: any
  tutorial?: TutorialDescription<Game, Move, PlayerId>,
  hasSounds?: boolean
}

class MissingRules {
  constructor() {
    throw new Error('Missing GameContext')
  }
}

// @ts-ignore
const missingContext: GameContext = { game: '', Rules: MissingRules }

export const gameContext = React.createContext<GameContext>(missingContext)

if (process.env.NODE_ENV !== 'production') {
  gameContext.displayName = 'GameContext'
}