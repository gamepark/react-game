import { GameMode, giveUp, useGameDispatch, useGameSelector } from '@gamepark/react-client'
import { usePlayerId } from './usePlayerId'

export const useGiveUp = (): [() => void, boolean] => {
  const dispatch = useGameDispatch()
  const doGiveUp = () => dispatch(giveUp())
  const playerId = usePlayerId()
  const gameOver = useGameSelector((state) => state.gameOver)
  const gameMode = useGameSelector((state) => state.gameMode)
  const canGiveUp = playerId !== undefined && !gameOver && gameMode !== GameMode.TUTORIAL
  return [doGiveUp, canGiveUp]
}
