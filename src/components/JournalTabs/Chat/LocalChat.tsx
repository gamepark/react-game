/** @jsxImportSource @emotion/react */
import { Message } from '@gamepark/react-client'
import { FC, HTMLAttributes, useRef, useState } from 'react'
import { LocalChatTextInput } from './ChatTextInput'
import { CommonChat } from './CommonChat'

type RemoteChatProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const LocalChat: FC<RemoteChatProps> = (props) => {
  const { open, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldScroll = useRef(false)
  const [messages, setMessages] = useState<Message[]>([])

  return <CommonChat
    messages={messages}
    scrollRef={scrollRef}
    shouldScroll={shouldScroll}
    Input={<LocalChatTextInput open={open} messages={messages.length} onMessageSent={(m: Message) => setMessages((messages) => [...messages, m])} { ...rest }/>}
    { ...rest }
  >
  </CommonChat>
}