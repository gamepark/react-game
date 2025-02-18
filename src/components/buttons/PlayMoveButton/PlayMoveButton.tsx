/** @jsxImportSource @emotion/react */
import { css, ThemeProvider } from '@emotion/react'
import { PlayOptions } from '@gamepark/react-client'
import { ButtonHTMLAttributes, FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonCss } from '../../../css'
import { usePlay } from '../../../hooks'
import { Dialog } from '../../dialogs'
import { ThemeButton } from '../ThemeButton'

export type PlayMoveButtonConfirmation = {
  text?: ReactNode
  cancelText?: ReactNode
}

export type PlayMoveButtonProps = {
  move: any
  moves?: any[]
  onPlay?: () => void
  confirmation?: PlayMoveButtonConfirmation
  auto?: number
} & PlayOptions & ButtonHTMLAttributes<HTMLButtonElement>

export const PlayMoveButton: FC<PlayMoveButtonProps> = (props) => {
  const { move, moves = move ? [move] : [], confirmation, delayed, skipAnimation, local, transient, onPlay, auto, ...rest } = props
  const play = usePlay()
  const { t } = useTranslation()
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [displayedLongEnough, setDisplayedLongEnough] = useState(false)
  const disabled = !moves.length
  useEffect(() => {
    if (disabled) {
      setDisplayedLongEnough(false)
    } else {
      const timeout = setTimeout(() => setDisplayedLongEnough(true), 200)
      return () => clearTimeout(timeout)
    }
  }, [disabled])

  const doPlay = useCallback(() => {
    setCountdown(undefined)
    setShowDialog(false)
    for (const move of moves) {
      play(move, { delayed, skipAnimation, local, transient })
    }
    if (onPlay) onPlay()
  }, [moves, delayed, skipAnimation, local, transient, onPlay])

  const onClick = useCallback(() => {
    if (confirmation !== undefined) {
      setShowDialog(true)
    } else if (displayedLongEnough) {
      doPlay()
    }
  }, [confirmation !== undefined, doPlay, displayedLongEnough])

  const [countdown, setCountdown] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (disabled) setCountdown(undefined)
    else setCountdown(auto)
  }, [disabled, auto])
  useEffect(() => {
    if (auto) {
      const interval = setInterval(() => setCountdown(countdown => countdown && countdown > 0 ? countdown - 1 : countdown), 1000)
      return () => clearInterval(interval)
    }
  }, [auto])
  useEffect(() => {
    if (countdown === 0) doPlay()
  }, [countdown])

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
  &:first-letter {
    text-transform: capitalize;
  }

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
