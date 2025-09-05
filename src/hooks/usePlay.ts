import { MOVE_PLAYED, PlayOptions } from '@gamepark/react-client'
import { useDispatch } from 'react-redux'

export const usePlay = <M>() => {
  const dispatch = useDispatch<any>()
  return (move: M, options?: PlayOptions) => {
    dispatch({ type: MOVE_PLAYED, move, ...options })
  }
}
