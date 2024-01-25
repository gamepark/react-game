import { useChatMessages, useMe } from '@gamepark/react-client'
import { FC, useRef } from 'react'
import { usePlayerId } from '../../hooks'
import { RemoteChatTextInput } from './ChatTextInput'
import { CommonChat } from './CommonChat'
import { SignInToChat } from './SignInToChat'

type RemoteChatProps = {
  gameId: string
}

export const RemoteChat: FC<RemoteChatProps> = (props) => {
  const { gameId } = props
  const me = useMe()
  const playerId = usePlayerId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldScroll = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, hasMoreMessages, loading, fetchMore } = useChatMessages(gameId, () => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight, scrollTop } = scrollRef.current
    if (clientHeight + scrollTop === scrollHeight) {
      shouldScroll.current = true
    }
  })

  const doFetchMore = () => fetchMore({ variables: { channel: `game=${gameId}`, maxDate: messages[0].date } })

  return <CommonChat
    loading={loading}
    hasMoreMessages={hasMoreMessages}
    messages={messages}
    scrollRef={scrollRef}
    shouldScroll={shouldScroll}
    fetchMore={doFetchMore}
    Input={playerId || me?.user?.id ? <RemoteChatTextInput channel={`game=${gameId}`} inputRef={inputRef}/> : <SignInToChat/>}
  />
}