import { css, keyframes } from '@emotion/react'
import { Message, Player, subscribeToChannel, unsubscribeFromChannel, useLiveGameChannel } from '@gamepark/react-client'
import { MouseEvent, useEffect, useState } from 'react'
import { SpeechBubble, SpeechBubbleProps } from './SpeechBubble'

type Props = {
  gameId: string
  player: Player
} & SpeechBubbleProps

export const ChatSpeechBubble = ({ gameId, player, ...props }: Props) => {
  // No speech bubble on a game already over when loaded: it would hold a Pusher connection for every visit
  const live = useLiveGameChannel()
  useEffect(() => {
    if (!live) return
    const channelName = `game=${gameId}`
    const channel = subscribeToChannel(channelName)
    const onMessage = (message: Message) => {
      if (message && player.userId === message.userId) {
        setMessage(message.text)
      }
    }
    channel.bind('message', onMessage)
    return () => {
      channel.unbind('message', onMessage)
      unsubscribeFromChannel(channelName)
    }
  }, [live])
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