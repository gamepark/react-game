import { useGameSelector } from '@gamepark/react-client'

export function useGame<Game>(): Game | undefined {
  return useGameSelector((state) => state.state)
}
