/** @jsxImportSource @emotion/react */
import { css, keyframes, ThemeProvider } from '@emotion/react'
import { useLogControls } from '@gamepark/react-client'
import { FC, HTMLAttributes, useEffect, useState } from 'react'
import { linkButtonCss } from '../../css'
import { MoveHistory, useFlatHistory } from '../../hooks/useFlatHistory'
import { LogItem } from './LogItem'

export type LiveLogContainerProps = {
  maxItemDisplayed?: number,
  duration?: number,
} & HTMLAttributes<HTMLDivElement>

type MoveHistoryDisplayed = MoveHistory & {
  deleting?: boolean,
}

const MAX_ITEM_DISPLAYED = 5
const DISPLAY_DURATION = 5000

const getFadeOutDuration = (duration: number = DISPLAY_DURATION) => {
  return 0.4 * duration
}

const getThrottleDuration = (maxItemDisplayed: number = MAX_ITEM_DISPLAYED, duration: number = DISPLAY_DURATION) => {
  return duration / maxItemDisplayed
}

const getDelayBeforeDelete = (duration: number = DISPLAY_DURATION) => {
  return duration - getFadeOutDuration(duration)
}

export const InternalLiveLogContainer: FC<LiveLogContainerProps> = (props) => {
  const { history, isLoaded } = useFlatHistory()
  const { stopped } = useLogControls()
  const [displayed, setDisplayed] = useState<MoveHistoryDisplayed[]>([])
  const [nextDisplayed, setNextDisplayed] = useState<number>(-1)
  const [isJustDisplayed, setJustDisplayed] = useState(false)
  const { duration, maxItemDisplayed = MAX_ITEM_DISPLAYED, ...rest } = props

  useEffect(() => {
    if (isLoaded) {
      setNextDisplayed(history.length)
    }
  }, [isLoaded])

  useEffect(() => {
    if (displayed.length < maxItemDisplayed && !stopped) {
      displayNextHistoryEntry()
    }
  }, [history, displayed, isJustDisplayed, stopped])

  const displayNextHistoryEntry = () => {
    if (!isLoaded || nextDisplayed === -1) return
    const next = history[nextDisplayed] as MoveHistoryDisplayed
    if (next && !isJustDisplayed) {
      setNextDisplayed(nextDisplayed + 1)
      setDisplayed((d) => d.concat(next))
      setJustDisplayed(true)
      setTimeout(() => setJustDisplayed(false), getThrottleDuration(maxItemDisplayed, duration))
      setTimeout(() => {
        setDisplayed((d) => {
          next.deleting = true
          return d
        })

        setTimeout(() => {
          setDisplayed((d) => d.filter((h) => h !== next))
        }, getFadeOutDuration(duration))
      }, getDelayBeforeDelete(duration))
    }
  }

  if (stopped) return null
  return (
    <ThemeProvider theme={theme => ({ ...theme, buttons: historyButtonCss })}>

      <div css={scrollContentCss}  {...rest}>
        {displayed.map((h) => (
          <LogItem key={`${h.action.id}_${h.consequenceIndex}`} history={h} css={[itemCss, h.deleting ? deletingCss(duration) : fadeInCss]}/>
        ))
        }
      </div>
    </ThemeProvider>
  )
}

const scrollContentCss = css`
    position: relative;
    > &:not(button) {
        pointer-events: none;
    }
`

const historyButtonCss = [linkButtonCss, css`
    color: inherit;
    background-color: transparent;
    font-style: italic;
`]

const itemCss = css`
    display: grid;
    grid-template-rows: 1fr;

    > div {
        overflow: hidden;
    }
`

const deletingAnimation = keyframes`
    50% {
        font-size: 1em;
        opacity: 0;
        grid-template-rows: 1fr;
    }
    100% {
        font-size: 0;
        opacity: 0;
        grid-template-rows: 0fr;
    }
`

const fadeInAnimation = keyframes`
    from {
        opacity: 0;
    }
`

const deletingCss = (duration: number = DISPLAY_DURATION) => css`
    animation: ${deletingAnimation} ${getFadeOutDuration(duration) - 50}ms forwards;
`

const fadeInCss = css`
    animation: ${fadeInAnimation} 1000ms;
`
