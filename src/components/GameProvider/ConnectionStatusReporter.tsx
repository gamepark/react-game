import { useGameSelector } from '@gamepark/react-client'
import { useEffect } from 'react'
import { notifyConnectionLost } from '../../utilities/platform.util'

/**
 * Forwards the connection state detected by react-client (requests that time out or fail, Pusher unable to connect) to the
 * platform page framing the game, which tells the player. Mounted for remote games only: a local game, such as a tutorial,
 * is played without the server.
 */
export const ConnectionStatusReporter = () => {
  const connectionLost = useGameSelector(state => !!state.connectionLost)
  useEffect(() => {
    if (!connectionLost) return
    notifyConnectionLost(true)
    return () => notifyConnectionLost(false)
  }, [connectionLost])
  return null
}
