import { clearFailures, GamePageState } from '@gamepark/react-client'
import { useDispatch, useSelector } from 'react-redux'

export function useFailures<Move = any>(): [string[], () => {}] {
  const dispatch = useDispatch()
  return [useSelector((state: GamePageState<any, Move>) => state.failures), () => dispatch(clearFailures())]
}