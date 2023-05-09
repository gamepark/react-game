import { useDispatch } from 'react-redux'
import { ActionType, MovePlayed } from '@gamepark/react-client'

export type PlayOptions = {
  delayed?: boolean
  skipAnimation?: boolean
  local?: boolean
}

export function usePlay<M>() {
  const dispatch = useDispatch<(action: MovePlayed<M>) => MovePlayed<M>>()
  return (move: M, options?: PlayOptions) => {
    dispatch({ type: ActionType.MOVE_PLAYED, move, ...options })
  }
}
