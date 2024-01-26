import { Animations, TutorialDescription } from '@gamepark/react-client'
import { HistoryDescription } from '@gamepark/react-client/dist/History/HistoryDescription'
import { RulesCreator } from '@gamepark/rules-api'
import React, { ComponentType } from 'react'
import { ItemLocatorRecord } from '../../locators'
import { MaterialDescriptionRecord } from '../material'

export type GameContext<Game = any, Move = any, PlayerId extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  game: string
  Rules: RulesCreator<Game, Move, PlayerId>
  material?: Partial<MaterialDescriptionRecord<PlayerId, MaterialType, LocationType>>
  materialI18n?: Record<string, Partial<MaterialDescriptionRecord<PlayerId, MaterialType, LocationType>>>
  locators?: Partial<ItemLocatorRecord<PlayerId, MaterialType, LocationType>>
  rulesHelp?: Record<number, ComponentType<{ close: () => void }>>
  optionsSpec?: any
  animations?: Animations<Game, Move, PlayerId>
  tutorial?: TutorialDescription<Game, Move, PlayerId>
  history?: HistoryDescription<Game, Move>
  hasSounds?: boolean
}

export type MaterialGameContext<Game = any, Move = any, PlayerId extends number = number, MaterialType extends number = number, LocationType extends number = number>
  = GameContext<Game, Move, PlayerId, MaterialType, LocationType> & {
  material: Partial<MaterialDescriptionRecord<PlayerId, MaterialType, LocationType>>
  locators: Partial<ItemLocatorRecord<PlayerId, MaterialType, LocationType>>
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