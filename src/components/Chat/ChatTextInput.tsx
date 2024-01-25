/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Message, useSendMessage } from '@gamepark/react-client'
import { FC, FormEvent, RefObject, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonResetCss } from '../../css'

type LocalChatTextInputProps = {
  channel: string
  onMessageSent: (message: Message) => void
  inputRef: RefObject<HTMLInputElement>
  messages: number
}


export const LocalChatTextInput: FC<LocalChatTextInputProps> = (props) => {
  const { onMessageSent, messages, inputRef } = props

  const onSubmit = (t: string) => {
    onMessageSent({ id: `${messages}`, text: t, date: new Date().toISOString(), userId: 'dev'})
  }

  return <ChatInput onSubmit={onSubmit} inputRef={inputRef} />
}


type RemoteChatTextInputProps = {
  channel: string
  inputRef: RefObject<HTMLInputElement>
}

export const RemoteChatTextInput: FC<RemoteChatTextInputProps> = ({ channel, inputRef }) => {
  const [sendMessage] = useSendMessage()
  const onSubmit = (text: string) => {
    sendMessage({ variables: { channel, text } }).catch(console.error)
  }

  return <ChatInput onSubmit={onSubmit} inputRef={inputRef} />
}

type ChatInputProps = {
  onSubmit: (text: string) => void
  inputRef: RefObject<HTMLInputElement>
}

export const ChatInput: FC<ChatInputProps> = ({ onSubmit, inputRef }) => {
  const [text, setText] = useState('')
  const { t } = useTranslation()
  const doSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault()
    onSubmit(text)
    setText('')
  }
  return (
    <form css={messageBar} onSubmit={doSubmit}>
      <input ref={inputRef} type="text" placeholder={t('Type a message')!} css={textInputCss} value={text} onChange={event => setText(event.target.value)}/>
      <button aria-label={t('Send')!} title={t('Send')!} css={[buttonResetCss, sendButtonStyle]}><FontAwesomeIcon icon={faPaperPlane}/></button>
    </form>
  )
}

const messageBar = css`
  width: 100%;
  padding: 0.5em;
  background: #28B8CE;
  display: flex;
`

const textInputCss = css`
  flex-grow: 1;
  border: none;
  border-radius: 1em;
  padding: 0.5em 0.8em;

  &:focus-visible {
    outline: none;
  }
`

const sendButtonStyle = css`
  background: none;
  color: white;
`