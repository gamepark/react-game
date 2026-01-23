import { createContext, useContext } from 'react'

export type GameTableContextType = {
  zoom: boolean
}

export const GameTableContext = createContext<GameTableContextType>({ zoom: true })

export const useGameTableContext = () => useContext(GameTableContext)
