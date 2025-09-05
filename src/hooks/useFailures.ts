import { clearFailures, GamePageState } from '@gamepark/react-client'
import { useDispatch, useSelector } from 'react-redux'

export const useFailures = <Move = any>(): [string[], () => {}] => {
  const dispatch = useDispatch<any>()
  return [useSelector((state: GamePageState<any, Move>) => state.failures), () => dispatch(clearFailures())]
}