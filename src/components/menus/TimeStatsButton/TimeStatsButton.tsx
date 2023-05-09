/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gameContext, menuButtonCss } from '@gamepark/react-client'
import { getFallbackPlayerName } from '@gamepark/rules-api'
import moment from 'moment'
import { Fragment, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../dialogs'
import { Avatar } from '../../Avatar'
import { usePlayers } from '../../../hooks'
import { menuDialogCss } from '../menuCss'

export const TimeStatsButton = () => {
  const { t } = useTranslation()
  const [displayPopup, setDisplayPopup] = useState(false)
  const context = useContext(gameContext)
  const players = usePlayers()

  return (
    <>
      <button css={menuButtonCss} onClick={() => setDisplayPopup(true)}>
        <FontAwesomeIcon icon={faClock}/>
        {t('time.button')}
      </button>
      <Dialog open={displayPopup} css={menuDialogCss} onBackdropClick={() => setDisplayPopup(false)}>
        <FontAwesomeIcon icon={faXmark} css={closeIcon} onClick={() => setDisplayPopup(false)}/>
        <h2>{t('time.title')}</h2>
        <div css={gridCss(players.length)}>
          <div/>
          <div css={[borderTop, orangeBackground]}>{t('time.think.total')}</div>
          <div css={[borderTop, blueBackground]}>{t('time.wait.total')}</div>
          <div css={[borderTop, orangeBackground]}>{t('time.think.max')}</div>
          <div css={[borderTop, blueBackground]}>{t('time.wait.max')}</div>
          <div css={[borderTop, orangeBackground]}>{t('time.awaited')}</div>
          {players.map((player, index) =>
            <Fragment key={index}>
              <div key={index} css={[relative, borderLeft]}>
                <Avatar playerId={player.id} css={avatarCss}/>
                <span>{player.name ?? getFallbackPlayerName(player.id, t, context.optionsSpec)}</span>
              </div>
              <div css={[borderLeft, borderTop, orangeBackground]}>
                {humanize(player.time?.cumulatedPlayTime)}
              </div>
              <div css={[borderLeft, borderTop, blueBackground]}>
                {humanize(player.time?.cumulatedDownTime)}
              </div>
              <div css={[borderLeft, borderTop, orangeBackground]}>
                {humanize(player.time?.highestPlayTime)}
              </div>
              <div css={[borderLeft, borderTop, blueBackground]}>
                {humanize(player.time?.highestDownTime)}
              </div>
              <div css={[borderLeft, borderTop, orangeBackground]}>
                {humanize(player.time?.weightedWaitForMeTime)}
              </div>
            </Fragment>
          )}
        </div>
      </Dialog>
    </>
  )
}

const closeIcon = css`
  position: absolute;
  right: 0.8em;
  top: 0.6em;
  font-size: 1.3em;
  cursor: pointer;
`

const gridCss = (players: number) => css`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: auto repeat(${players}, 1fr);
  grid-template-rows: repeat(6, auto);

  > div {
    padding: 1em;
  }
`

const avatarCss = css`
  position: relative;
  width: 3em;
  height: 3em;
  margin-bottom: 0.5em;
`

const relative = css`
  position: relative;
`

const borderLeft = css`
  border-left: 0.2em solid #28b8ce;
`

const borderTop = css`
  border-top: 0.2em solid #28b8ce;
`

const orangeBackground = css`
  background-color: #fff3e3;
`

const blueBackground = css`
  background-color: #b3e9f0;
`

const oneDay = moment.duration('1', 'day')
const oneHour = moment.duration('1', 'hour')

function humanize(duration?: number) {
  if (duration === undefined) return '-'
  if (duration >= oneDay.asMilliseconds()) {
    return moment.duration(duration).humanize()
  } else if (duration >= oneHour.asMilliseconds()) {
    return moment.utc(duration).format('HH:mm:ss')
  } else {
    return moment.utc(duration).format('mm:ss')
  }
}