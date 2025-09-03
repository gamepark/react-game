/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { Message, Player, pusherClient } from '@gamepark/react-client'
import { MouseEvent, useEffect, useState } from 'react'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'

type Props = {
  gameId: string
  player: Player
} & SpeechBubbleProps

export const ChatSpeechBubble = ({ gameId, player, ...props }: Props) => {
  useEffect(() => {
    const channel = pusherClient.subscribe(`game=${gameId}`)
    channel.bind('message', (message: Message) => {
      if (message && player.userId === message.userId) {
        setMessage(message.text)
      }
    })
    return () => pusherClient.unsubscribe(`game=${gameId}`)
  }, [])
  const [message, setMessage] = useState('')
  const hideMessage = () => setMessage('')
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(hideMessage, 5000)
      return () => clearTimeout(timeout)
    }
  }, [message])
  const onClick = (event: MouseEvent) => {
    hideMessage()
    event.stopPropagation()
  }
  return message ? <SpeechBubble css={chatSpeechBubbleCss} onClick={onClick} {...props}>{message}</SpeechBubble> : null
}

const fadeOut = keyframes`
  to {
    opacity: 0
  }
`

const chatSpeechBubbleCss = css`
  animation: 1s ${fadeOut} 4s forwards;
`