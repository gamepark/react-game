/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC, useCallback, useEffect, useState } from 'react'
import { PlayOptions, usePlay } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'
import { Dialog } from '../../dialogs'
import { css, ThemeProvider } from '@emotion/react'
import { buttonCss } from '../../../css'
import { useTranslation } from 'react-i18next'
import { useIsAnimatingPlayerAction } from '../../material/utils/useIsAnimatingPlayerAction'
import { now } from 'lodash'

export type PlayMoveButtonConfirmation = {
  text?: string
  cancelText?: string
}

export type PlayMoveButtonProps = {
  move: any
  onPlay?: () => void
  confirmation?: PlayMoveButtonConfirmation
} & PlayOptions & ButtonHTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = (props) => {
  const { move, confirmation, delayed, skipAnimation, local, onPlay, ...rest } = props
  const play = usePlay()
  const { t } = useTranslation()
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [displayedLongEnough, setDisplayedLongEnough] = useState(false)
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const disabled = move === undefined || (isAnimatingPlayerAction && !local)
  useEffect(() => {
    if (disabled) {
      setDisplayedLongEnough(false)
    } else {
      const timeout = setTimeout(() => setDisplayedLongEnough(true), 200)
      return () => clearTimeout(timeout)
    }
  }, [disabled])
  if (Array.isArray(rest.children) && rest.children[0] === 'pass') {
    console.log(displayedLongEnough, now())
  }

  const doPlay = useCallback(() => {
    setShowDialog(false)
    play(move, { delayed, skipAnimation, local })
    if (onPlay) onPlay()
  }, [move, delayed, skipAnimation, local, onPlay])

  const onClick = useCallback(() => {
    if (confirmation !== undefined) {
      setShowDialog(true)
    } else if (displayedLongEnough) {
      doPlay()
    }
  }, [confirmation !== undefined, doPlay, displayedLongEnough])

  return (
    <>
      {!!confirmation && (
        <Dialog key="dialog" open={showDialog} onBackdropClick={() => setShowDialog(false)} css={[flex, confirmationDialogCss]}>
          <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
            <div css={content}>
              <p>{confirmation.text}</p>
              <div css={buttons}>
                <ThemeButton onClick={() => setShowDialog(false)} {...rest}>
                  {confirmation.cancelText ?? t('Cancel')}
                </ThemeButton>
                <ThemeButton css={moveButton} onClick={doPlay} {...rest} />
              </div>
            </div>
          </ThemeProvider>
        </Dialog>
      )}
      <ThemeButton key="button" onClick={onClick} disabled={disabled} {...rest}/>
    </>
  )
}
const buttons = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 0.3em;
`

const moveButton = css`
  text-transform: capitalize;
  align-self: flex-end;

  > button {
    white-space: break-spaces;
  }
`

const flex = css`
  display: flex;
  padding: 3em 1em 3em 3em;
  max-width: 90vw;
  max-height: 90vh;
`

const content = css`
  margin: 0 1em;
  font-size: 3em;
  display: flex;
  flex-direction: column;
`

const confirmationDialogCss = css`
  position: relative;
  background-color: #f0fbfc;
  color: #002448;
  padding: 1em;
  border-radius: 1em;
  box-shadow: 0 0 0.2em black;
  font-family: "Mulish", sans-serif;
`
