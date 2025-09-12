/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { MutableRefObject, ReactElement, ReactNode, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { ChatMessage } from './ChatMessage'

type CommonChatProps = {
  children?: ReactNode
  gameId?: string
  loading?: boolean
  hasMoreMessages?: boolean
  messages: any[]
  fetchMore: () => void
  Input: ReactElement,
  shouldScroll: MutableRefObject<boolean>
}

export function CommonChat(props: CommonChatProps) {
  const { loading, hasMoreMessages, messages, shouldScroll, Input, fetchMore, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight } = scrollRef.current
    if (shouldScroll.current) {
      scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' })
      shouldScroll.current = false
    }
  }, [messages])

  return (
    <>
      <div ref={scrollRef} id="chat" css={scrollCss} {...rest}>
        <InfiniteScroll dataLength={messages.length}
                        next={fetchMore}
                        css={scrollContentCss}
                        inverse
                        hasMore={!loading && !!hasMoreMessages && messages.length > 0}
                        loader={<p>...</p>}
                        scrollableTarget="chat">
          {messages.map((message, index) =>
            <ChatMessage key={message.id} message={message} showAuthor={index === messages.length - 1 || messages[index + 1].userId !== message.userId}/>
          )}
        </InfiniteScroll>
      </div>
      {Input}
    </>
  )
}


const scrollCss = css`
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  display: flex;
  flex-direction: column-reverse;
  scrollbar-color: rgba(74, 74, 74, 0.3) transparent;
  scrollbar-width: thin;
  margin-top: 0.5em;
  margin-left: 0.5em;
  margin-right: 8px;

  &::-webkit-scrollbar {
    width: 6px
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 7px;
    background-color: rgba(74, 74, 74, 0.3);
  }

  align-self: stretch;
`

const scrollContentCss = css`
  position: relative;
  padding-left: 2.5em;
  padding-right: 1em;
  padding-bottom: 0.5em;
  font-size: 0.7em;
  display: flex;
  flex-direction: column-reverse;
`
