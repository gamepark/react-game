/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { LocalChat } from './LocalChat'
import { RemoteChat } from './RemoteChat'

type ChatProps = {
  gameId?: string
}

export const Chat: FC<ChatProps> = (props) => {
  const { gameId } = props;
  if (!gameId) {
    return <LocalChat />
  }

  return <RemoteChat gameId={gameId} />
}