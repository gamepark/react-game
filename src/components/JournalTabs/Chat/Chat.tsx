import { FC, HTMLAttributes } from 'react'
import { LocalChat } from './LocalChat'
import { RemoteChat } from './RemoteChat'

type ChatProps = {
  open: boolean
  gameId?: string
} & HTMLAttributes<HTMLDivElement>

export const Chat: FC<ChatProps> = (props) => {
  const { gameId, open, ...rest } = props
  if (!gameId) {
    return <LocalChat open={open} { ...rest }/>
  }

  return <RemoteChat gameId={gameId} open={open} { ...rest }/>
}