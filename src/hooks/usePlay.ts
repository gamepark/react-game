import { playMove, PlayOptions, useGameDispatch } from '@gamepark/react-client'

export const usePlay = <M>() => {
  const dispatch = useGameDispatch()
  return (move: M, options?: PlayOptions) => {
    dispatch(playMove({ move, options }))
  }
}
