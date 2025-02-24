/** @jsxImportSource @emotion/react */
import { css, ThemeProvider } from '@emotion/react'
import { FC, HTMLAttributes, useEffect, useRef } from 'react'
import { linkButtonCss } from '../../../css'
import { useHistory } from '../../../hooks/useHistory'
import { GameOverHistory } from './GameOverHistory'
import { StartGameHistory } from './StartGameHistory'

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
    <ThemeProvider theme={theme => ({ ...theme, buttons: historyButtonCss })}>
      <div css={scrollCss} ref={scrollRef} {...rest}>
        <div css={scrollContentCss}>
          <StartGameHistory/>
          {Array.from(histories.entries()).map(([id, actions = []]) => (
            actions.map((action, index) => {
              console.log(action)
              return (
                <div key={`${id}_${index}`} css={entryCss}>
                  {action}
                </div>
              )
            })
          ))}
          <GameOverHistory/>
        </div>
      </div>
    </ThemeProvider>
  )
}

const entryCss = css`
    &:not(:empty) {
        margin-bottom: 1em;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 1em;
        color: white;
        overflow: hidden;    
    }
`

const scrollCss = css`
  overflow-x: hidden;
  overflow-y: scroll;
    background-color: transparent;
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
