import { css, useTheme } from '@emotion/react'
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward'
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward'
import { faForwardFast } from '@fortawesome/free-solid-svg-icons/faForwardFast'
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { playTutorialMoves, useGameDispatch } from '@gamepark/react-client'
import { isCloseTutorialPopup, isSetTutorialStep, SetTutorialStep } from '@gamepark/rules-api'
import { maxBy, minBy } from 'es-toolkit'
import { TFunction } from 'i18next'
import { Children, isValidElement, ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { transformCss } from '../../css'
import { useLegalMove, useLegalMoves, useMaterialContext, useUndo } from '../../hooks'
import { useTutorialStep } from '../../hooks/useTutorialStep'
import { PlayMoveButton, ThemeButton } from '../buttons'
import { Dialog } from '../dialogs'
import { useFocusContext } from '../material'

export const MaterialTutorialDisplay = () => {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation('common')
  const context = useMaterialContext()
  const game = context.rules.game
  const tutorialStep = useTutorialStep()
  const tutorialMoves = useLegalMoves<SetTutorialStep>(isSetTutorialStep)
  const closeTutorialPopup = useLegalMove(isCloseTutorialPopup)

  const popup = tutorialStep?.popup

  const dispatch = useGameDispatch()
  useEffect(() => {
    dispatch(playTutorialMoves(Infinity))
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

  const theme = useTheme()

  const textKeys: string[] = []
  const trackedT = ((key: string | string[], ...args: unknown[]) => {
    textKeys.push(...[key].flat())
    return (t as unknown as (...params: unknown[]) => string)(key, ...args)
  }) as unknown as TFunction
  const text = popup?.text(trackedT, game!)
  if (process.env.NODE_ENV !== 'production') collectTransKeys(text, textKeys)

  return (
    <Dialog open={popup !== undefined && !game?.tutorial?.popupClosed}
            css={[
              tutorialDialogCss,
              popup?.position && transformCss(`translate(${popup.position.x ?? 0}em, ${popup.position.y ?? 0}em)`),
              sizeCss(popup?.size),
              theme.tutorial?.container
            ]}
            backdropCss={backdropCss}>
      {popup &&
        <div css={[rules, theme.tutorial?.content]}>
          {process.env.NODE_ENV !== 'production' && <span css={debugKeyCss}>{textKeys.length ? textKeys.join(', ') : `#${game!.tutorial!.step}`}</span>}
          {passMove && <PlayMoveButton move={passMove} css={passButton}>{tCommon('Pass')}&nbsp;<FontAwesomeIcon icon={faForwardFast}/></PlayMoveButton>}
          <p>{text}</p>
          <p css={buttonsLine}>
            <ThemeButton disabled={!canUndoLastMove} onClick={() => undo()}><FontAwesomeIcon icon={faBackward}/>&nbsp;{tCommon('Previous')}</ThemeButton>
            {closeTutorialPopup ?
              <PlayMoveButton move={closeTutorialPopup}>{tCommon('OK')}&nbsp;<FontAwesomeIcon icon={faPlay}/></PlayMoveButton>
              : <PlayMoveButton move={nextStepMove} disabled={!nextStepMove}>{tCommon('Next')}&nbsp;<FontAwesomeIcon icon={faForward}/></PlayMoveButton>
            }
          </p>
        </div>
      }
    </Dialog>
  )
}

const rules = css`
  margin: 0 1em;
  font-size: calc(3em * var(--gp-scale));
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

/** Finds the keys of the <Trans i18nKey> elements returned by the text of the popup */
const collectTransKeys = (node: ReactNode, keys: string[]) => {
  Children.forEach(node, child => {
    if (!isValidElement<{ i18nKey?: string | string[], children?: ReactNode }>(child)) return
    if (child.props.i18nKey) keys.push(...[child.props.i18nKey].flat())
    collectTransKeys(child.props.children, keys)
  })
}

// Debug help in development: the translation keys of the text (or the index of the step when there are none), absolute so that the text is not shifted
const debugKeyCss = css`
  position: absolute;
  top: 0.6em;
  left: 0.8em;
  font-size: 0.5em;
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
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
