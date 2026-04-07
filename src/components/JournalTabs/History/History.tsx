import { css, keyframes, ThemeProvider, useTheme } from '@emotion/react'
import { useGameSelector } from '@gamepark/react-client'
import { FC, HTMLAttributes, useContext, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { linkButtonCss } from '../../../css'
import { useFlatHistory } from '../../../hooks/useFlatHistory'
import { gameContext } from '../../index'
import { GameOverHistory } from './GameOverHistory'
import { LazyLogItem } from './LazyLogItem'
import { SetupLogItem } from './SetupLogItem'
import { StartGameHistory } from './StartGameHistory'

type HistoryProps = {
  open: boolean
} & HTMLAttributes<HTMLDivElement>

export const History: FC<HistoryProps> = (props) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const context = useContext(gameContext)
  const setup = useGameSelector((state) => state.setup) ?? {}
  const { history, isLoaded } = useFlatHistory()
  const { open, ...rest } = props
  const scrollRef = useRef<HTMLDivElement>(null)

  const setupLogs = useMemo(() => {
    if (!context.logs?.getSetupLogDescriptions) return []
    return context.logs.getSetupLogDescriptions(setup)
  }, [setup])

  // Scroll to bottom when loaded or when opening
  useEffect(() => {
    if (!scrollRef.current || !open || !isLoaded) return
    const el = scrollRef.current
    const scrollToBottom = () => el.scrollTo({ top: el.scrollHeight - el.clientHeight })
    scrollToBottom()
    const content = el.firstElementChild
    if (!content) return
    const observer = new ResizeObserver(scrollToBottom)
    observer.observe(content)
    // Stop auto-scrolling as soon as the user scrolls manually
    const onUserScroll = () => { observer.disconnect(); el.removeEventListener('wheel', onUserScroll); el.removeEventListener('touchmove', onUserScroll) }
    el.addEventListener('wheel', onUserScroll, { once: true })
    el.addEventListener('touchmove', onUserScroll, { once: true })
    const timeout = setTimeout(() => { observer.disconnect(); onUserScroll() }, 2000)
    return () => { observer.disconnect(); clearTimeout(timeout); onUserScroll() }
  }, [open, isLoaded])

  return (
    <ThemeProvider theme={theme => ({ ...theme, buttons: historyButtonCss })}>
      <div css={scrollCss} ref={scrollRef} {...rest}>
        <div css={scrollContentCss}>
          <StartGameHistory/>
          {setupLogs.map((log, index) =>
            <SetupLogItem key={`setup_${index}`} log={log} game={setup} index={index} css={itemCss}
                          customEntryCss={[customEntryCss, theme.journal?.historyEntry]}/>
          )}
          {!isLoaded && (
            <div css={loaderCss}>
              <div css={spinnerCss}/>
              {t('history.loading', { defaultValue: 'Loading history...' })}
            </div>
          )}
          {history.map((h) => {
            if (!h.action.id) return null
            const key = h.consequenceIndex !== undefined ? `${h.action.id}_${h.consequenceIndex}` : h.action.id
            return <LazyLogItem key={key} history={h} itemCss={itemCss}
                                customEntryCss={[customEntryCss, theme.journal?.historyEntry]}
                                root={scrollRef.current}/>
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

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const loaderCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  padding: 2em;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.5em;
  font-style: italic;
`

const spinnerCss = css`
  width: 1.2em;
  height: 1.2em;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`
