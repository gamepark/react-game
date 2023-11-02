import { MaterialContext } from '../index'

export function getRelativePlayerIndex({ rules: { players }, player: me }: MaterialContext, player = me): number {
  if (player === undefined) return -1
  const absoluteIndex = players.indexOf(player)
  if (me === undefined || players[0] === me) return absoluteIndex
  return (absoluteIndex - players.indexOf(me) + players.length) % players.length
}
