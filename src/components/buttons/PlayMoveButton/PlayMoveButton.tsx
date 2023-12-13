/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC, useCallback, useEffect, useState } from 'react'
import { PlayOptions, usePlay } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'
import { Dialog } from '../../dialogs'
import { css, ThemeProvider } from '@emotion/react'
import { buttonCss } from '../../../css'
import { useTranslation } from 'react-i18next'
import { useIsAnimatingPlayerAction } from '../../material/utils/useIsAnimatingPlayerAction'

export type PlayMoveButtonConfirmation = {
  text?: string
  cancelText?: string
}

export type PlayMoveButtonProps = {
  move: any
  onPlay?: () => void
  confirmation?: PlayMoveButtonConfirmation
  auto?: number
} & PlayOptions & ButtonHTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = (props) => {
  const { move, confirmation, delayed, skipAnimation, local, onPlay, auto, ...rest } = props
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

  const [countdown, setCountdown] = useState(auto)
  useEffect(() => {
    if (auto) {
      const interval = setInterval(() => setCountdown(countdown => countdown && countdown > 0 ? countdown - 1 : countdown), 1000)
      return () => clearInterval(interval)
    }
  }, [auto])
  useEffect(() => {
    if (countdown === 0) play(move)
  }, [countdown, move])

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
      <ThemeButton key="button" onClick={onClick} disabled={disabled} css={countdown && countdownCss(countdown)} {...rest}/>
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
  
  p {
    white-space: break-spaces;
  }
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

const countdownCss = (countdown: number) => css`
  padding-right: 2em;
  position: relative;

  &:after {
    content: '${countdown}';
    position: absolute;
    right: 0.5em;
    font-style: italic;
  }
`
