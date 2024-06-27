import { useDispatch } from 'react-redux'
import { ActionType, PlayOptions } from '@gamepark/react-client'

export const usePlay = <M>() => {
  const dispatch = useDispatch()
  return (move: M, options?: PlayOptions) => {
    dispatch({ type: ActionType.MOVE_PLAYED, move, ...options })
  }
}
