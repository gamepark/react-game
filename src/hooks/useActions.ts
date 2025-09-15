import { DisplayedAction, useGameSelector } from '@gamepark/react-client'

export const useActions = <Move = any, PlayerId = any>(): DisplayedAction<Move, PlayerId>[] | undefined =>
  useGameSelector((state) => state.actions)