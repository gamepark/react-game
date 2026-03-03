import { css, ThemeProvider, useTheme } from '@emotion/react'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { onSurfaceButtonCss } from '../../../css'
import { Dialog, DialogProps } from '../index'

export type RulesDialogProps = {
  close?: () => void
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = ({ close, children, ...props }: RulesDialogProps) => {
  const theme = useTheme()
  return (
    <Dialog onBackdropClick={close} css={dialogCss} {...props}>
      {close && <FontAwesomeIcon icon={faXmark} css={[dialogCloseIcon, theme.dialog.closeIcon]} onClick={close}/>}
      <ThemeProvider theme={theme => ({ ...theme, buttons: onSurfaceButtonCss })}>
        {children}
      </ThemeProvider>
    </Dialog>
  )
}

const dialogCss = css`
  max-width: 90vw;
  max-width: 90dvw;
  max-height: 90vh;
  max-height: 90dvh;
  padding: 0;
`

const dialogCloseIcon = css`
  position: absolute;
  right: 0.5em;
  top: 0.3em;
  font-size: calc(4em * var(--gp-scale));
  cursor: pointer;
  z-index: 100;
`
