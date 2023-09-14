/** @jsxImportSource @emotion/react */
import { Dialog } from '../dialogs'
import { useGame, useLegalMoves, useUndo } from '../../hooks'
import { CloseTutorialPopup, isSetTutorialStep, LocalMoveType, MaterialGame, MoveKind, SetTutorialStep } from '@gamepark/rules-api'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { css, ThemeProvider } from '@emotion/react'
import { PlayMoveButton, ThemeButton } from '../buttons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { buttonCss, transformCss } from '../../css'
import minBy from 'lodash/minBy'
import maxBy from 'lodash/maxBy'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward'
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward'
import { useTutorialStep } from '../../hooks/useTutorialStep'
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay'
import { useDispatch } from 'react-redux'
import { playTutorialMovesAction } from '@gamepark/react-client/dist/Tutorial/PlayTutorialMoves'

export const MaterialTutorialDisplay = () => {
  const { t } = useTranslation()
  const game = useGame<MaterialGame>()
  const tutorialStep = useTutorialStep()
  const tutorialMoves = useLegalMoves<SetTutorialStep>(isSetTutorialStep)

  const popup = tutorialStep?.popup

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(playTutorialMovesAction(Infinity))
  }, [])

  const nextStepMove = minBy(tutorialMoves, move => move.step)
  const passMove = maxBy(tutorialMoves, move => move.step)

  const [undo, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  return (
    <Dialog open={popup !== undefined && !game?.tutorialPopupClosed}
            css={[
              tutorialDialogCss,
              popup?.position && transformCss(`translate(${popup.position.x}em, ${popup.position.y}em)`)
            ]}
            backdropCss={backdropCss}>
      {popup &&
        <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
          <div css={rules}>
            {passMove && <PlayMoveButton move={passMove} css={passButton}>{t('Pass')}&nbsp;<FontAwesomeIcon icon={faForwardFast}/></PlayMoveButton>}
            <p>{popup.text(t)}</p>
            <p css={buttonsLine}>
              <ThemeButton disabled={!canUndoLastMove} onClick={() => undo()}><FontAwesomeIcon icon={faBackward}/>&nbsp;{t('Previous')}</ThemeButton>
              {nextStepMove ?
                <PlayMoveButton move={nextStepMove} disabled={!nextStepMove}>{t('Next')}&nbsp;<FontAwesomeIcon icon={faForward}/></PlayMoveButton>
                : <PlayMoveButton move={closeTutorialPopup}>{t('OK')}&nbsp;<FontAwesomeIcon icon={faPlay}/></PlayMoveButton>
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
  width: 80em;
  pointer-events: auto;
  transition: transform 0.1s ease-in-out;
`

const closeTutorialPopup: CloseTutorialPopup = { kind: MoveKind.LocalMove, type: LocalMoveType.CloseTutorialPopup }