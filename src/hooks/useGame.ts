import { GamePageState } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export const useGame = <Game>(): Game | undefined => useSelector((state: GamePageState<Game>) => state.state)
