import { useContext } from 'react'
import { gameContext } from '../components'

export const useLocators = () => useContext(gameContext).locators
