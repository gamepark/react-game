import { css } from '@emotion/react'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Message, useSendMessage } from '@gamepark/react-client'
import { FC, FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonResetCss } from '../../../css'

type LocalChatTextInputProps = {
  onMessageSent: (message: Message) => void
  messages: number
  open: boolean
}


export const LocalChatTextInput: FC<LocalChatTextInputProps> = (props) => {
  const { onMessageSent, messages, open } = props

  const onSubmit = (t: string) => {
    if (!t) return
    onMessageSent({ id: `${messages}`, text: t, date: new Date().toISOString(), userId: 'dev'})
  }

  return <ChatInput open={open} onSubmit={onSubmit} />
}


type RemoteChatTextInputProps = {
  channel: string
  open: boolean
}

export const RemoteChatTextInput: FC<RemoteChatTextInputProps> = (props) => {
  const { channel, open } = props
  const [sendMessage] = useSendMessage()
  const onSubmit = (text: string) => {
    sendMessage({ variables: { channel, text } }).catch(console.error)
  }

  return <ChatInput open={open} onSubmit={onSubmit} />
}

type ChatInputProps = {
  onSubmit: (text: string) => void
  open: boolean
}

export const ChatInput: FC<ChatInputProps> = (props) => {
  const { open, onSubmit } = props
  const [text, setText] = useState('')
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const doSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault()
    onSubmit(text)
    setText('')
  }
  return (
    <form css={[messageBar, !open && hidden]} onSubmit={doSubmit}>
      <input ref={inputRef} type="text" placeholder={t('Type a message')!} css={textInputCss} value={text} onChange={event => setText(event.target.value)}/>
      <button disabled={!text} aria-label={t('Send')!} title={t('Send')!} css={[buttonResetCss, sendButtonStyle, !text && disableSubmit]}><FontAwesomeIcon css={!text && transparent} icon={faPaperPlane}/></button>
    </form>
  )
}

const disableSubmit = css`
  cursor: not-allowed;
`

const transparent = css`
  opacity: 0.4;
`

const hidden = css`
  display: none;
`

const messageBar = css`
  width: 100%;
  padding: 0.5em;
  background: #28B8CE;
  display: flex;
  font-size: 0.5em;
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
  font-size: 1.5em;
`