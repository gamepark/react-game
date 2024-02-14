/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FC, Fragment, HTMLAttributes, useEffect, useRef } from 'react'
import { useHistory } from '../../../hooks/useHistory'
import { StartGameHistory } from './StartHistory'

type HistoryProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const History: FC<HistoryProps> = (props) => {

  const { histories } = useHistory()
  const { open, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  // TODO: Add an icon to tell "there is more to see"

  useEffect(() => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight } = scrollRef.current
    scrollRef.current.scrollTo({ top: scrollHeight - clientHeight })
  }, [open])

  return (
    <div css={scrollCss} ref={scrollRef} { ...rest }>
      <div css={scrollContentCss}>
        <StartGameHistory />
        {[...histories.entries()].map(([id, actions = []]) => (
          actions.map((action, index) => (
            <Fragment key={`${id}_${index}`}>
              {action}
            </Fragment>
          ))
        ))}
      </div>
    </div>
  )
}


const scrollCss = css`
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-color: rgba(74, 74, 74, 0.3) transparent;
  scrollbar-width: thin;
  margin-top: 0.5em;
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
  font-size: 0.5em;
`