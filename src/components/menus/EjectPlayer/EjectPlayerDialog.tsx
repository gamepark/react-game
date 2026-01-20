import { css } from '@emotion/react'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons/faUserSlash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ejectPlayer, useGameDispatch, useGameSelector } from '@gamepark/react-client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOpponentWithMaxTime, usePlayerName } from '../../../hooks'
import { Dialog, DialogProps } from '../../dialogs'
import { menuButtonCss, menuDialogCss } from '../menuCss'

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const EjectPlayerDialog = ({ close, ...props }: DialogProps & { close: () => void }) => {
  const { t } = useTranslation('common')
  const maxExceedTime = useGameSelector((state) => state.options?.maxExceedTime ?? 60000)
  const opponentWithNegativeTime = useOpponentWithMaxTime(0)
  const opponentThatCanBeEjected = useOpponentWithMaxTime()
  const dispatch = useGameDispatch()
  const opponentName = usePlayerName(opponentWithNegativeTime?.id)
  useEffect(() => {
    if (!opponentWithNegativeTime) {
      close()
    }
  }, [opponentWithNegativeTime])
  if (!opponentWithNegativeTime) return null
  return (
    <Dialog onBackdropClick={close} css={menuDialogCss} {...props}>
      <h2>{t('eject.dialog.p1', { player: opponentName })}</h2>
      {!opponentThatCanBeEjected ?
        <p>{t('eject.dialog.p2', { duration: dayjs.duration(maxExceedTime).humanize() })}</p> :
        <p>{t('eject.dialog.p3')}</p>
      }
      <div css={buttonLineCss}>
        <button css={[menuButtonCss, inDialogButton]} onClick={close}>{t('Close')}</button>
        {opponentThatCanBeEjected &&
          <button css={[menuButtonCss, buttonCss, inDialogButton]} onClick={() => dispatch(ejectPlayer(opponentThatCanBeEjected.id))}>
            <FontAwesomeIcon icon={faUserSlash}/>
            {t('Eject {player}', { player: opponentName })}
          </button>
        }
      </div>
    </Dialog>
  )
}

const buttonCss = css`
  color: darkred;
  border-color: darkred;

  &:focus, &:hover {
    background: #ffd7d7
  }

  &:active {
    background: #ffbebe
  }
`

const buttonLineCss = css`
  margin-top: 1em;
  display: flex;
  justify-content: space-between;
`

const inDialogButton = css`
  margin: 0;
`