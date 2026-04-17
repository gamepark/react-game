import { css, useTheme } from '@emotion/react'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clearFailures, Failure, PLATFORM_URI, useGameDispatch, useGameSelector } from '@gamepark/react-client'
import { TFunction } from 'i18next'
import { useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { gameContext } from '../GameProvider'
import { NavButton } from '../menus/Menu/NavButton'
import { menuButtonCss, menuDialogCss, paletteMenuButtonCss } from '../menus/menuCss'
import { Dialog, DialogProps } from './Dialog'

const query = new URLSearchParams(window.location.search)
const locale = query.get('locale') || 'en'

export const FailuresDialog = (props: Omit<DialogProps, 'open'>) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const { game } = useContext(gameContext)
  const failures = useGameSelector((state) => state.failures)
  const dispatch = useGameDispatch()
  const [displayedFailure, setDisplayedFailure] = useState('')
  useEffect(() => {
    if (failures.length) {
      setDisplayedFailure(failures[0])
    } else {
      const timeout = setTimeout(() => setDisplayedFailure(''), 500)
      return () => clearTimeout(timeout)
    }
  }, [failures])
  const description = failuresDescription[displayedFailure] ?? fallbackDescription(displayedFailure)
  const terminal = isTerminalFailure(displayedFailure)
  const themedButtonCss = [menuButtonCss, paletteMenuButtonCss, theme.menu?.button]
  return (
    <Dialog open={failures.length > 0} css={menuDialogCss}
            backdropCss={terminal && aboveLoadingScreenCss}
            onBackdropClick={terminal ? undefined : () => dispatch(clearFailures())} {...props}>
      <h2 css={titleCss}>
        <FontAwesomeIcon icon={faTriangleExclamation} css={iconCss}/>
        {description.title(t)}
      </h2>
      <p>{description.text(t)}</p>
      {terminal ? (
        <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${game}`}>{t('Back to Game Park')}</NavButton>
      ) : (
        <>
          <button css={[...themedButtonCss, inDialogButton]} onClick={() => dispatch(clearFailures())}>{t('OK')}</button>
          {displayedFailure === Failure.MOVE_FORBIDDEN && <p>
            <Trans ns="common" i18nKey="failure.dialog.play2"
                   components={[<button css={[...themedButtonCss, css`display: inline-block`]} onClick={() => window.location.reload()}/>]}/>
          </p>}
        </>
      )}
    </Dialog>
  )
}

function isTerminalFailure(failure: string): boolean {
  return failure === Failure.GAME_NOT_FOUND || failure === Failure.GAME_LOAD_ERROR
}

const failuresDescription: Record<string, { title: (t: TFunction) => string, text: (t: TFunction) => string }> = {
  [Failure.NETWORK]: {
    title: (t) => t('Whoops...'),
    text: (t) => t('failure.dialog.network')
  },
  [Failure.MOVE_FORBIDDEN]: {
    title: (t) => t('Move unauthorized!'),
    text: (t) => t('failure.dialog.play')
  },
  [Failure.UNDO_FORBIDDEN]: {
    title: (t) => t('Too late!'),
    text: (t) => t('failure.dialog.undo')
  },
  [Failure.TUTORIAL_MOVE_EXPECTED]: {
    title: (t) => t('Move not expected in the tutorial'),
    text: (t) => t('failure.dialog.tutorial')
  },
  [Failure.GAME_NOT_FOUND]: {
    title: (t) => t('error.game-not-found.title'),
    text: (t) => t('error.game-not-found.hint')
  },
  [Failure.GAME_LOAD_ERROR]: {
    title: (t) => t('error.game-load.title'),
    text: (t) => t('error.game-load.hint')
  }
}

const fallbackDescription = (failure: string) => ({
  title: (t: TFunction) => t('Unknown error:'),
  text: () => failure
})

const aboveLoadingScreenCss = css`
  z-index: 1600;
`

const titleCss = css`
  display: flex;
  align-items: center;
  gap: 0.4em;
`

const iconCss = css`
  color: #28B8CE;
`

const inDialogButton = css`
  margin: 0 0 0 auto;
  font-size: 1.125em;
`
