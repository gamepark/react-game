/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC, useCallback, useState } from 'react'
import { PlayOptions, usePlay } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'
import { Dialog } from '../../dialogs'
import { css, ThemeProvider } from '@emotion/react'
import { buttonCss } from '../../../css'
import { useTranslation } from 'react-i18next'

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

  const close = () => setShowDialog(false)
  const onClick = useCallback(() => {
    if (!showDialog && confirmation?.text) {
      setShowDialog(true)
      return
    }

    setShowDialog(false)
    play(move, { delayed, skipAnimation, local })
    if (onPlay) onPlay()
  }, [move, delayed, skipAnimation, local, onPlay])


  return (
    <>
      {!!confirmation && (
        <Dialog key="dialog" open={showDialog} onBackdropClick={close} css={[flex, confirmationDialogCss]}>
          <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
            <div css={content}>
              <div css={description}>{confirmation.text}</div>
              <div css={buttons}>
                <ThemeButton onClick={close} disabled={move === undefined} {...rest}>{confirmation.cancelText ?? t('Cancel')}</ThemeButton>
                <ThemeButton css={moveButton} onClick={onClick} disabled={move === undefined} {...rest} />
              </div>
            </div>
          </ThemeProvider>
        </Dialog>
      )}
      <ThemeButton key="button" onClick={onClick} disabled={move === undefined} {...rest}/>
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

const description = css`
  margin-bottom: 1em;
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
