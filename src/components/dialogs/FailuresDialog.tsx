import { css } from '@emotion/react'
import { clearFailures, Failure, useGameDispatch, useGameSelector } from '@gamepark/react-client'
import { TFunction } from 'i18next'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { menuButtonCss, menuDialogCss } from '../menus/menuCss'
import { Dialog, DialogProps } from './Dialog'

export const FailuresDialog = (props: Omit<DialogProps, 'open'>) => {
  const { t } = useTranslation('common')
  const failures = useGameSelector((state) => state.failures)
  const dispatch = useGameDispatch()
  const [displayedFailure, setDisplayedFailure] = useState('')
  useEffect(() => {
    if (failures.length) {
      setDisplayedFailure(failures[0])
    } else {
      setTimeout(() => setDisplayedFailure(''), 500)
    }
  }, [failures])
  const description = failuresDescription[displayedFailure] || fallbackDescription(displayedFailure)
  return (
    <Dialog open={failures.length > 0} css={menuDialogCss} {...props}>
      <h2>{description.title(t)}</h2>
      <p>{description.text(t)}</p>
      <button css={[menuButtonCss, inDialogButton]} onClick={() => dispatch(clearFailures())}>{t('OK')}</button>
      {displayedFailure === Failure.MOVE_FORBIDDEN && <p>
        <Trans ns="common" i18nKey="failure.dialog.play2"
               components={[<button css={[menuButtonCss, css`display: inline-block`]} onClick={() => window.location.reload()}/>]}/>
      </p>}
    </Dialog>
  )
}

const failuresDescription = {
  [Failure.NETWORK]: {
    title: (t: TFunction) => t('Whoops...'),
    text: (t: TFunction) => t('failure.dialog.network')
  },
  [Failure.MOVE_FORBIDDEN]: {
    title: (t: TFunction) => t('Move unauthorized!'),
    text: (t: TFunction) => t('failure.dialog.play')
  },
  [Failure.UNDO_FORBIDDEN]: {
    title: (t: TFunction) => t('Too late!'),
    text: (t: TFunction) => t('failure.dialog.undo')
  },
  [Failure.TUTORIAL_MOVE_EXPECTED]: {
    title: (t: TFunction) => t('Move not expected in the tutorial'),
    text: (t: TFunction) => t('failure.dialog.tutorial')
  }
}

const fallbackDescription = (failure: string) => ({
  title: (t: TFunction) => t('Unknown error:'),
  text: () => failure
})

const inDialogButton = css`
  margin: 0 0 0 auto;
  font-size: 1.125em;
`