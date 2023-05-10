/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { buttonCss, useSendMessage } from '@gamepark/react-client'
import { FormEvent, RefObject, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  channel: string
  inputRef: RefObject<HTMLInputElement>
}

export const ChatTextInput = ({ channel, inputRef }: Props) => {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [sendMessage] = useSendMessage()
  const onSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault()
    sendMessage({ variables: { channel, text } }).catch(console.error)
    setText('')
  }
  return (
    <form css={messageBar} onSubmit={onSubmit}>
      <input ref={inputRef} type="text" placeholder={t('Type a message')!} css={textInputCss} value={text} onChange={event => setText(event.target.value)}/>
      <button aria-label={t('Send')!} title={t('Send')!} css={[buttonCss, sendButtonStyle]}><FontAwesomeIcon icon={faPaperPlane}/></button>
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
  padding: 0.2em 0.5em;

  &:focus-visible {
    outline: none;
  }
`

const sendButtonStyle = css`
  background: none;
  color: white;
`