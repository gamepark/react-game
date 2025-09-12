import { useChatMessages, useMe } from '@gamepark/react-client'
import { FC, HTMLAttributes, useRef } from 'react'
import { usePlayerId } from '../../../hooks'
import { RemoteChatTextInput } from './ChatTextInput'
import { CommonChat } from './CommonChat'
import { SignInToChat } from './SignInToChat'

type RemoteChatProps = {
  open: boolean
  gameId: string
} & HTMLAttributes<HTMLDivElement>

export const RemoteChat: FC<RemoteChatProps> = (props) => {
  const { gameId, open, ...rest } = props
  const me = useMe()
  const playerId = usePlayerId()
  const shouldScroll = useRef(false)
  const { messages, hasMoreMessages, loading, fetchMore } = useChatMessages(gameId, () => {
    shouldScroll.current = true
  })

  return <CommonChat
    loading={loading}
    hasMoreMessages={hasMoreMessages}
    messages={messages}
    shouldScroll={shouldScroll}
    fetchMore={fetchMore}
    Input={playerId || me?.user?.id ? <RemoteChatTextInput channel={`game=${gameId}`} open={open}/> : <SignInToChat/>}
    {...rest}
  />
}