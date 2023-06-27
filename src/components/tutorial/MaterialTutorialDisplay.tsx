/** @jsxImportSource @emotion/react */
import { Dialog, rulesDialogCss } from '../dialogs'
import { useGame, useLegalMoves, useUndo } from '../../hooks'
import { isSetTutorialStep, MaterialGame, SetTutorialStep } from '@gamepark/rules-api'
import { useContext, useEffect, useState } from 'react'
import { gameContext } from '../GameProvider'
import { MaterialTutorial, TutorialPopupStep, TutorialStep, TutorialStepType } from './MaterialTutorial'
import { useTranslation } from 'react-i18next'
import { css, ThemeProvider } from '@emotion/react'
import { PlayMoveButton, ThemeButton } from '../buttons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { buttonCss } from '../../css'
import { useTutorial } from '@gamepark/react-client'
import minBy from 'lodash/minBy'
import maxBy from 'lodash/maxBy'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward'
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward'

export const MaterialTutorialDisplay = () => {
  const { t } = useTranslation()
  const game = useGame<MaterialGame>()
  const tutorialMoves = useLegalMoves<SetTutorialStep>(isSetTutorialStep)
  const tutorialStep = game?.tutorialStep ?? 0
  const tutorial = useContext(gameContext).tutorial as MaterialTutorial
  const step = tutorial.steps[tutorialStep] as TutorialStep | undefined
  const [popupStep, setPopupStep] = useState<TutorialPopupStep>()

  const { setOpponentsPlayAutomatically } = useTutorial()!
  useEffect(() => setOpponentsPlayAutomatically(), [])

  useEffect(() => {
    if (step?.type === TutorialStepType.Popup) {
      setPopupStep(step)
    }
  }, [step])

  const nextStepMove = minBy(tutorialMoves, move => move.step)
  const passMove = maxBy(tutorialMoves, move => move.step)

  const [undo, canUndo] = useUndo()
  const canUndoLastMove = canUndo()

  return (
    <Dialog open={step?.type === TutorialStepType.Popup} css={[rulesDialogCss, tutorialDialogCss]} backdropCss={backdropCss}>
      {popupStep &&
        <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
          <div css={rules}>
            <PlayMoveButton move={passMove} css={passButton}>{t('Pass')}&nbsp;<FontAwesomeIcon icon={faForwardFast}/></PlayMoveButton>
            <p>{popupStep.text(t)}</p>
            <p css={buttonsLine}>
              <ThemeButton disabled={!canUndoLastMove} onClick={() => undo()}><FontAwesomeIcon icon={faBackward}/>&nbsp;{t('Previous')}</ThemeButton>
              <PlayMoveButton move={nextStepMove} disabled={!nextStepMove}>{t('Next')}&nbsp;<FontAwesomeIcon icon={faForward}/></PlayMoveButton>
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
`