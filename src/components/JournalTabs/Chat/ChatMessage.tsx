import { css } from '@emotion/react'
import { Message } from '@gamepark/react-client'
import { ChatMessageAuthor } from './ChatMessageAuthor'

type Props = {
  message: Message
  showAuthor: boolean
}

export const ChatMessage = ({ message, showAuthor }: Props) => (
  <div css={chatMessageCss}>
    {showAuthor && <ChatMessageAuthor author={message.userId}/>}
    <p css={textCss}>{message.text}</p>
  </div>
)

const chatMessageCss = css`
`

const textCss = css`
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
  font-size: 0.7em;
`
