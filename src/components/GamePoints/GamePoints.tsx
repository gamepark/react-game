import { css } from '@emotion/react'
import { useGameSelector } from '@gamepark/react-client'
import { HTMLAttributes, useEffect, useState } from 'react'
import { getLocale } from '../../utilities/translation.util'
import { GamePointIcon } from './index'

type Props<PlayerId> = {
  playerId: PlayerId
  suspense?: number
  test?: number
} & HTMLAttributes<HTMLSpanElement>

export const GamePoints = <PlayerId extends any>({ playerId, suspense = 0.1, test, ...props }: Props<PlayerId>) => {
  const player = useGameSelector((state) => state.players.find(p => p.id === playerId))
  const gamePointsDelta = player?.gamePointsDelta ?? test
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (player && gamePointsDelta === undefined) {
      setHidden(true)
    } else if (hidden && gamePointsDelta !== undefined) {
      setTimeout(() => setHidden(false), suspense * 1000)
    }
  }, [player, gamePointsDelta, hidden, suspense, setHidden])
  if (gamePointsDelta === undefined) return null
  return <span css={[style, hidden && hiddenCss]} {...props}><GamePointIcon/>{gamePointsDelta > 0 && '+'}{formatGamePoints(gamePointsDelta)}</span>
}

// Game points are integers, except when a game moved the score by less than half a point: the site then
// reports the real variation with one decimal, so that a game never looks like it did not count at all.
const formatGamePoints = (gamePoints: number) => gamePoints.toLocaleString(getLocale(), { maximumFractionDigits: 1 })

const style = css`
  display: flex;
  align-items: center;
  transition: opacity 0.3s;
`

const hiddenCss = css`
  opacity: 0;
`
