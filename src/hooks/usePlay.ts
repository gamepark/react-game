import { playMove, PlayOptions, useGameDispatch } from '@gamepark/react-client'
import { useCallback } from 'react'

export const usePlay = <M>() => {
  const dispatch = useGameDispatch()
  return useCallback((move: M, options?: PlayOptions) => {
    dispatch(playMove({ move, options }))
  }, [dispatch])
}
