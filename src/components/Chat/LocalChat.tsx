/** @jsxImportSource @emotion/react */
import { Message } from '@gamepark/react-client'
import { FC, useRef, useState } from 'react'
import { LocalChatTextInput } from './ChatTextInput'
import { CommonChat } from './CommonChat'

type RemoteChatProps = {}

export const LocalChat: FC<RemoteChatProps> = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldScroll = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([])

  return <CommonChat
    messages={messages}
    scrollRef={scrollRef}
    shouldScroll={shouldScroll}
    Input={<LocalChatTextInput messages={messages.length} onMessageSent={(m: Message) => setMessages((messages) => [...messages, m])} inputRef={inputRef}/>}
  >
  </CommonChat>
}