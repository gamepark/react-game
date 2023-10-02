/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ejectPlayerAction, GamePageState } from '@gamepark/react-client'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dialog, DialogProps } from '../../dialogs'
import { menuButtonCss, menuDialogCss } from '../menuCss'
import { useOpponentWithMaxTime, usePlayerName } from '../../../hooks'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const EjectPlayerDialog = ({ close, ...props }: DialogProps & { close: () => void }) => {
  const { t } = useTranslation()
  const maxExceedTime = useSelector((state: GamePageState) => state.options?.maxExceedTime ?? 60000)
  const opponentWithNegativeTime = useOpponentWithMaxTime(0)
  const opponentThatCanBeEjected = useOpponentWithMaxTime()
  const dispatch = useDispatch()
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
          <button css={[menuButtonCss, buttonCss, inDialogButton]} onClick={() => dispatch(ejectPlayerAction(opponentThatCanBeEjected.id))}>
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