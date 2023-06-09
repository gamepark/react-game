import { Animations, TutorialDescription } from '@gamepark/react-client'
import { RulesCreator } from '@gamepark/rules-api'
import React from 'react'
import { MaterialDescription } from '../material'
import { ItemLocator } from '../../locators'

export type GameContext<Game = any, Move = any, PlayerId = any, MaterialType extends number = number, LocationType extends number = number> = {
  game: string
  Rules: RulesCreator<Game, Move, PlayerId>
  material?: Record<MaterialType, MaterialDescription>
  materialI18n?: Record<string, Partial<Record<MaterialType, MaterialDescription>>>
  locators?: Record<LocationType, ItemLocator>
  optionsSpec?: any
  animations?: Animations<Game, Move, PlayerId>
  tutorial?: TutorialDescription<Game, Move, PlayerId>
  hasSounds?: boolean
}

export type MaterialGameContext<Game = any, Move = any, PlayerId = any, MaterialType extends number = number, LocationType extends number = number>
  = GameContext<Game, Move, PlayerId, MaterialType, LocationType> & {
  material: Record<MaterialType, MaterialDescription>
  locators: Record<LocationType, ItemLocator>
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