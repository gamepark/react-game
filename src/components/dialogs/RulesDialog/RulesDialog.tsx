/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { Dialog, DialogProps } from '../index'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { css, ThemeProvider } from '@emotion/react'
import { buttonCss } from '../../../css'

export type RulesDialogProps = {
  close: () => void
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = ({ close, children, ...props }: RulesDialogProps) => {
  return (
    <Dialog css={rulesDialogCss} onBackdropClick={close} {...props}>
      <FontAwesomeIcon icon={faXmark} css={dialogCloseIcon} onClick={close}/>
      <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
        {children}
      </ThemeProvider>
    </Dialog>
  )
}

const dialogCloseIcon = css`
  position: absolute;
  right: 0.5em;
  top: 0.3em;
  font-size: 4em;
  cursor: pointer;
  z-index: 100;
`

export const rulesDialogCss = css`
  position: relative;
  background-color: #f0fbfc;
  color: #002448;
  padding: 1em;
  border-radius: 1em;
  box-shadow: 0 0 0.2em black;
  font-family: "Mulish", sans-serif;
`
