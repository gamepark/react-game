import { Rules } from '@gamepark/rules-api'
import { ReactElement } from 'react'

export type ScoringValue = string | number | ReactElement

export interface ScoringDescription<Player extends number = number, GameRule extends Rules = Rules, Key = any> {

  getScoringKeys(rules: GameRule): Key[]

  getScoringHeader(key: Key, rules: GameRule): ScoringValue

  getScoringPlayerData(key: Key, player: Player, rules: GameRule): ScoringValue | null
}