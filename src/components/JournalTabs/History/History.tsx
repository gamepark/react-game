import { css, ThemeProvider, useTheme } from '@emotion/react'
import { useGameSelector } from '@gamepark/react-client'
import { FC, HTMLAttributes, useContext, useEffect, useMemo, useRef } from 'react'
import { linkButtonCss } from '../../../css'
import { useFlatHistory } from '../../../hooks/useFlatHistory'
import { gameContext, LogItem } from '../../index'
import { GameOverHistory } from './GameOverHistory'
import { SetupLogItem } from './SetupLogItem'
import { StartGameHistory } from './StartGameHistory'

type HistoryProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const History: FC<HistoryProps> = (props) => {
  const theme = useTheme()
  const context = useContext(gameContext)
  const setup = useGameSelector((state) => state.setup) ?? {}
  const { history } = useFlatHistory()
  const { open, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  const setupLogs = useMemo(() => {
    if (!context.logs?.getSetupLogDescriptions) return []
    return context.logs.getSetupLogDescriptions(setup)
  }, [setup])

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
          {setupLogs.map((log, index) =>
            <SetupLogItem key={`setup_${index}`} log={log} game={setup} index={index} css={itemCss}
                          customEntryCss={[customEntryCss, theme.journal?.historyEntry]}/>
          )}
          {history.map((h) => {
            if (!h.action.id) return null // wait for server action.id
            const key = h.consequenceIndex !== undefined ? `${h.action.id}_${h.consequenceIndex}` : h.action.id
            return <LogItem key={key} history={h} css={itemCss} customEntryCss={[customEntryCss, theme.journal?.historyEntry]}/>
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
