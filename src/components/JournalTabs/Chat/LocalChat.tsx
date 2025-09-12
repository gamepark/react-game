/** @jsxImportSource @emotion/react */
import { Message } from '@gamepark/react-client'
import { FC, HTMLAttributes, useEffect, useRef, useState } from 'react'
import { LocalChatTextInput } from './ChatTextInput'
import { CommonChat } from './CommonChat'

type RemoteChatProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const LocalChat: FC<RemoteChatProps> = (props) => {
  const { open, ...rest } = props
  const shouldScroll = useRef(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    shouldScroll.current = true
  }, [messages])

  return <CommonChat
    messages={messages}
    shouldScroll={shouldScroll}
    fetchMore={() => undefined}
    Input={<LocalChatTextInput open={open} messages={messages.length} onMessageSent={(m: Message) => setMessages((messages) => [...messages, m])} {...rest}/>}
    {...rest}
  >
  </CommonChat>
}