import { css, useTheme } from '@emotion/react'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogProps } from '../index'

export type RulesDialogProps = {
  close?: () => void
  /** Goes back to the previous content of the dialog: a back button is displayed when it is defined */
  back?: () => void
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = ({ close, back, children, ...props }: RulesDialogProps) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const CloseButton = theme.dialog.closeButton
  const BackButton = theme.dialog.backButton
  return (
    <Dialog onBackdropClick={close} css={dialogCss} {...props}>
      {close && (CloseButton ? <CloseButton onClick={close}/> : <FontAwesomeIcon icon={faXmark} css={[dialogCloseIcon, theme.dialog.closeIcon]} onClick={close}/>)}
      {back && (BackButton ? <BackButton onClick={back}/> : <FontAwesomeIcon icon={faArrowLeft} title={t('Back')} css={[dialogBackIcon, theme.dialog.backIcon]} onClick={back}/>)}
      {children}
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

const dialogBackIcon = css`
  position: absolute;
  left: 0.5em;
  top: 0.3em;
  font-size: calc(3.4em * var(--gp-scale));
  cursor: pointer;
  z-index: 100;
`
