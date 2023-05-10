import { GameMode, GamePageState, giveUpAction } from '@gamepark/react-client'
import { useDispatch, useSelector } from 'react-redux'
import { usePlayerId } from './usePlayerId'

export const useGiveUp = (): [() => void, boolean] => {
  const dispatch = useDispatch()
  const giveUp = () => dispatch(giveUpAction)
  const playerId = usePlayerId()
  const gameOver = useSelector((state: GamePageState) => state.gameOver)
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const canGiveUp = playerId !== undefined && !gameOver && gameMode !== GameMode.TUTORIAL
  return [giveUp, canGiveUp]
}
