import { useDispatch } from 'react-redux'
import { ActionType } from '@gamepark/react-client'

export type PlayOptions = {
  delayed?: boolean
  skipAnimation?: boolean
  local?: boolean
}

export const usePlay = <M>() => {
  const dispatch = useDispatch()
  return (move: M, options?: PlayOptions) => {
    dispatch({ type: ActionType.MOVE_PLAYED, move, ...options })
  }
}
