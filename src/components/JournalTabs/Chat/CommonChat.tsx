/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, MutableRefObject, ReactElement, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { ChatMessage } from './ChatMessage'

type CommonChatProps = {
  gameId?: string
  loading?: boolean
  hasMoreMessages?: boolean
  messages: any[]
  fetchMore?: () => void
  Input: ReactElement,
  shouldScroll: MutableRefObject<boolean>
}

export const CommonChat: FC<CommonChatProps> = (props) => {
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
      <div ref={scrollRef} id="fui" css={scrollCss} { ...rest }>
        <InfiniteScroll css={scrollContentCss} useWindow={false} isReverse getScrollParent={() => scrollRef.current}
                        hasMore={!loading && hasMoreMessages && messages.length > 0}
                        loadMore={fetchMore ? fetchMore : (() => undefined)}>
          {messages.map((message, index) =>
            <ChatMessage key={message.id} message={message} showAuthor={index === 0 || messages[index - 1].userId !== message.userId}/>
          )}
        </InfiniteScroll>
      </div>
      {Input}
    </>
  )
}


const scrollCss = css`
  overflow-x: hidden;
  overflow-y: scroll;
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
  display: flex;
  flex-direction: column;
`

const scrollContentCss = css`
  position: relative;
  padding-left: 2.5em;
  padding-right: 1em;
  padding-bottom: 0.5em;
`