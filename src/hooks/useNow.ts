import { GamePageState } from '@gamepark/react-client'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

type Options = {
  updateRate?: number
  standby?: boolean
}

export const useNow = ({ updateRate = 1000, standby = false }: Options = { updateRate: 1000, standby: false }): number => {
  const [now, setNow] = useState((new Date()).getTime())
  const clientTimeDelta = useSelector((state: GamePageState) => state.clientTimeDelta || 0)

  useEffect(() => {
    if (!standby) {
      const interval = setInterval(() => {
        setNow(now => now + updateRate)
      }, updateRate)
      return () => clearInterval(interval)
    }
    return
  }, [standby, updateRate])

  return now - clientTimeDelta
}