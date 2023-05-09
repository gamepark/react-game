/** @jsxImportSource @emotion/react */
import {css, keyframes} from '@emotion/react'
import { Message, Player } from '@gamepark/react-client'
import {useChannel, useEvent} from '@harelpls/use-pusher'
import {MouseEvent, useEffect, useState} from 'react'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'

type Props = {
  gameId: string
  player: Player
} & SpeechBubbleProps

export default function ChatSpeechBubble({gameId, player, ...props}: Props) {
  const channel = useChannel(`game=${gameId}`)
  const [message, setMessage] = useState('')
  useEvent<Message>(channel, 'message', message => {
    if (message && player.userId === message.userId) {
      setMessage(message.text)
    }
  })
  const hideMessage = () => setMessage('')
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(hideMessage, 3000)
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
  animation: 1s ${fadeOut} 2s forwards;
`