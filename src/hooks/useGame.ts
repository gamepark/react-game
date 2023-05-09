import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function useGame<Game>(): Game | undefined {
  return useSelector((state: GamePageState<Game>) => state.state)
}
