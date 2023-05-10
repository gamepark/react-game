/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { Message } from '@gamepark/react-client'
import { ChatMessageAuthor } from './ChatMessageAuthor'

type Props = {
  message: Message
  showAuthor: boolean
}

export const ChatMessage = ({ message, showAuthor }: Props) => <>
  {showAuthor && <ChatMessageAuthor author={message.userId}/>}
  <p css={textCss}>{message.text}</p>
</>

const textCss = css`
  line-height: 1.5;
  margin: 0;
`
