import { ItemMoveType } from '@gamepark/rules-api'
import { FlatMaterialDescription } from './FlatMaterial'
import PlayCard from './sounds/play-card.wav'


//const PlayCard = 'https://sounds.game-park.com/play-card.wav'

export class CardDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {
  width = 6.3
  height = 8.8
  borderRadius = 0.4

  defaultSounds = {
    [ItemMoveType.Move]: { sound: PlayCard, volume: 0.2},
    [ItemMoveType.MoveAtOnce]: { sound: PlayCard, volume: 0.2},
    [ItemMoveType.Create]: { sound: PlayCard, volume: 0.2},
    [ItemMoveType.CreateAtOnce]: { sound: PlayCard, volume: 0.2},
  }
}
