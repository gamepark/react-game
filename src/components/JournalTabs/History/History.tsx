import { css, ThemeProvider } from '@emotion/react'
import { FC, HTMLAttributes, useEffect, useRef } from 'react'
import { linkButtonCss } from '../../../css'
import { useFlatHistory } from '../../../hooks/useFlatHistory'
import { LogItem } from '../../Log'
import { GameOverHistory } from './GameOverHistory'
import { StartGameHistory } from './StartGameHistory'

type HistoryProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const History: FC<HistoryProps> = (props) => {

  const { history } = useFlatHistory()
  const { open, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    const { scrollHeight, clientHeight } = scrollRef.current
    scrollRef.current.scrollTo({ top: scrollHeight - clientHeight })
  }, [open])

  return (
    <ThemeProvider theme={theme => ({ ...theme, buttons: historyButtonCss })}>
      <div css={scrollCss} ref={scrollRef} {...rest}>
        <div css={scrollContentCss}>
          <StartGameHistory/>
          {history.map((h) => {
            if (!h.action.id) return null // wait for server action.id
            const key = h.consequenceIndex !== undefined ? `${h.action.id}_${h.consequenceIndex}` : h.action.id
            return <LogItem key={key} history={h} css={itemCss} customEntryCss={customEntryCss}/>
          })}
          <GameOverHistory/>
        </div>
      </div>
    </ThemeProvider>
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

export const historyButtonCss = [linkButtonCss, css`
  color: inherit;
  background-color: transparent;
  font-style: italic;
`]

const itemCss = css`
  margin-left: 0.7em;
  font-size: 0.5em;
  user-select: text;
  white-space: pre-wrap;
`

const customEntryCss = css`
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
`
