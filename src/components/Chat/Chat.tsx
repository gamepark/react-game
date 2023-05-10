/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faComments } from '@fortawesome/free-regular-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { floatingButtonCss, hide, menuBaseCss, useChatMessages, useMe, usePlayerId } from '@gamepark/react-client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroller'
import { useKeyDown } from '../../hooks'
import { backdrop, displayBackdrop } from '../menus'
import { ChatMessage } from './ChatMessage'
import { ChatTextInput } from './ChatTextInput'
import { SignInToChat } from './SignInToChat'

export const Chat = ({ gameId }: { gameId: string }) => {
  const { t } = useTranslation()
  const [isOpen, setOpen] = useState(false)
  const me = useMe()
  const playerId = usePlayerId()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  useKeyDown('Enter', () => setOpen(true))
  useKeyDown('Escape', () => setOpen(false))
  const { messages, hasMoreMessages, loading, fetchMore } = useChatMessages(gameId, () => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight, scrollTop } = scrollRef.current
    if (clientHeight + scrollTop === scrollHeight) {
      shouldScroll.current = true
    }
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldScroll = useRef(false)
  useEffect(() => {
    if (!scrollRef.current || !shouldScroll.current) return
    const { scrollHeight, clientHeight } = scrollRef.current
    scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' })
    shouldScroll.current = false
  }, [messages])
  return (
    <>
      <div css={[backdrop, isOpen && displayBackdrop]} onClick={() => setOpen(false)}/>
      <div css={[menuBaseCss, chatCss, !isOpen && hide]}>
        <div ref={scrollRef} id="fui" css={scrollCss}>
          <InfiniteScroll css={scrollContentCss} useWindow={false} isReverse getScrollParent={() => scrollRef.current}
                          hasMore={!loading && hasMoreMessages && messages.length > 0}
                          loadMore={() => fetchMore({ variables: { channel: `game=${gameId}`, maxDate: messages[0].date } })}>
            {messages.map((message, index) =>
              <ChatMessage key={message.id} message={message} showAuthor={index === 0 || messages[index - 1].userId !== message.userId}/>
            )}
          </InfiniteScroll>
        </div>
        {playerId || me?.user?.id ? <ChatTextInput channel={`game=${gameId}`} inputRef={inputRef}/> : <SignInToChat/>}
      </div>
      <button aria-label={t('Discuss')!} title={t('Discuss')!} css={[floatingButtonCss, chatButtonCss]} onClick={() => setOpen(!isOpen)}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} css={iconStyle}/>
      </button>
    </>
  )
}

const chatButtonCss = css`
  z-index: 1000;
  top: 0;
  left: 0;
  border-bottom-right-radius: 25%;
  background: #28B8CE;
  height: 2.5em;
  width: 2.5em;
  min-width: 38px;
  min-height: 38px;

  &:focus, &:hover {
    background: #24a5b9;
  }

  &:active {
    background: #2092a3;
  }

  svg {
    position: relative;
    width: 70%;
    height: 60%;
  }
`

const iconStyle = css`
  color: white;
  font-size: 1.5em;
  @media (max-height: 300px) {
    font-size: 20px;
  }
`

const chatCss = css`
  font-size: 16px;
  left: 0;
  height: 100vh;
  width: 360px;
  max-width: 100vw;
  border-bottom-right-radius: 0.5em;
  transform-origin: top left;
  justify-content: flex-end;
`

const scrollCss = css`
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-color: rgba(74, 74, 74, 0.3) transparent;
  scrollbar-width: thin;
  margin-left: 16px;
  margin-right: 8px;

  &::-webkit-scrollbar {
    width: 6px
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 7px;
    background-color: rgba(74, 74, 74, 0.3);
  }

  align-self: stretch;
  display: flex;
  flex-direction: column;
`

const scrollContentCss = css`
  position: relative;
  padding-left: 3em;
`