/** @jsxImportSource @emotion/react */
import { css, ThemeProvider } from '@emotion/react'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward'
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward'
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { playTutorialMovesAction } from '@gamepark/react-client'
import { isCloseTutorialPopup, isSetTutorialStep, SetTutorialStep } from '@gamepark/rules-api'
import { maxBy, minBy } from 'es-toolkit'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { buttonCss, transformCss } from '../../css'
import { useLegalMove, useLegalMoves, useMaterialContext, useUndo } from '../../hooks'
import { useTutorialStep } from '../../hooks/useTutorialStep'
import { PlayMoveButton, ThemeButton } from '../buttons'
import { Dialog } from '../dialogs'
import { useFocusContext } from '../material'

export const MaterialTutorialDisplay = () => {
  const { t } = useTranslation()
  const context = useMaterialContext()
  const game = context.rules.game
  const tutorialStep = useTutorialStep()
  const tutorialMoves = useLegalMoves<SetTutorialStep>(isSetTutorialStep)
  const closeTutorialPopup = useLegalMove(isCloseTutorialPopup)

  const popup = tutorialStep?.popup

  const dispatch = useDispatch<any>()
  useEffect(() => {
    dispatch(playTutorialMovesAction(Infinity))
  }, [])

  const nextStepMove = minBy(tutorialMoves, move => move.step)
  const passMove = maxBy(tutorialMoves, move => move.step)

  const [undo, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  const { setFocus } = useFocusContext()

  useEffect(() => {
    if (game && !game.tutorial?.popupClosed) {
      if (tutorialStep?.focus) {
        setFocus({ materials: [], staticItems: [], locations: [], highlight: true, ...tutorialStep.focus(game, context) })
      } else {
        const move = tutorialStep?.move
        const isMyTurn = move !== undefined && !game.tutorial?.interrupt && (!move?.player || move?.player === game.players[0])
        setFocus(undefined, !isMyTurn)
      }
    } else {
      setFocus(undefined, false)
    }
  }, [tutorialStep, game?.tutorial?.popupClosed])

  return (
    <Dialog open={popup !== undefined && !game?.tutorial?.popupClosed}
            css={[
              tutorialDialogCss,
              popup?.position && transformCss(`translate(${popup.position.x ?? 0}em, ${popup.position.y ?? 0}em)`),
              sizeCss(popup?.size)
            ]}
            backdropCss={backdropCss}>
      {popup &&
        <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
          <div css={rules}>
            {passMove && <PlayMoveButton move={passMove} css={passButton}>{t('Pass')}&nbsp;<FontAwesomeIcon icon={faForwardFast}/></PlayMoveButton>}
            <p>{popup.text(t, game!)}</p>
            <p css={buttonsLine}>
              <ThemeButton disabled={!canUndoLastMove} onClick={() => undo()}><FontAwesomeIcon icon={faBackward}/>&nbsp;{t('Previous')}</ThemeButton>
              {closeTutorialPopup ?
                <PlayMoveButton move={closeTutorialPopup}>{t('OK')}&nbsp;<FontAwesomeIcon icon={faPlay}/></PlayMoveButton>
                : <PlayMoveButton move={nextStepMove} disabled={!nextStepMove}>{t('Next')}&nbsp;<FontAwesomeIcon icon={faForward}/></PlayMoveButton>
              }
            </p>
          </div>
        </ThemeProvider>
      }
    </Dialog>
  )
}

const rules = css`
  margin: 0 1em;
  font-size: 3em;
  padding-top: 1em;

  > h2 {
    margin: 0 1em;
    text-align: center;
  }

  > p {
    white-space: break-spaces;
  }
`

const backdropCss = css`
  background: none;
  pointer-events: none;
  z-index: 900;
`

const passButton = css`
  position: absolute;
  font-size: 0.7em;
  top: 1em;
  right: 1.8em;
`

const buttonsLine = css`
  display: flex;
  justify-content: space-between;
`

const tutorialDialogCss = css`
  pointer-events: auto;
  transition: transform 0.1s ease-in-out;
`

const sizeCss = (size?: { height?: number, width?: number }) => css`
  width: ${size?.width ?? 80}em;
  ${size?.height !== undefined ? `height: ${size.height}em;` : ''}
`
