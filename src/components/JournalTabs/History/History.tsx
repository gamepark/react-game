/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, HTMLAttributes, memo, ReactElement, useEffect, useMemo, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { useHistory } from '../../../hooks/useHistory'

type HistoryProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const History: FC<HistoryProps> = (props) => {

  const { histories, size } = useHistory()
  const { open } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // TOTO: prefer to add indicator that tells "new actions"
    //if (!scrollRef.current) return
    //const { scrollHeight, clientHeight } = scrollRef.current
    //scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' })
  }, [size])

  useEffect(() => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight } = scrollRef.current
    //scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' })
    scrollRef.current.scrollTo({ top: scrollHeight - clientHeight })
  }, [open])

  const entries = useMemo(() => [...histories.entries()], [size])

  return (
    <div ref={scrollRef} css={[historyContainer, scrollCss]} { ...props }>
      <InfiniteScroll css={scrollContentCss} useWindow={false} getScrollParent={() => scrollRef.current}
                      loadMore={() => undefined}>
        {entries.map(([actionId, actions]) => {
            if (!actions) return []
            return actions.map((h: ReactElement, index: number) => (
              <HistoryEntry key={`${actionId}_${index}`}>{h}</HistoryEntry>
            ))
          }
        )}
      </InfiniteScroll>

    </div>
  )
}

type HistoryEntryProps = {
}

export const HistoryEntry: FC<HistoryEntryProps> = memo(({ children }) => {
  return (
    <div css={historyEntryStyle}>
      {children}
    </div>
  )

})

const historyEntryStyle = css`
  width: 100%;
  padding: 0.7em 0.5em 0.7em 0.7em;
  font-size: 0.7em;
  border-bottom: 0.05em solid lightgray;
  user-select: text;
  
  &:last-of-type {
    border-bottom: 0;
  }
`

const historyContainer = css`
`


const scrollCss = css`
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-color: rgba(74, 74, 74, 0.3) transparent;
  scrollbar-width: thin;
  padding-top: 0.5em;
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
  padding-bottom: 0.5em;
`