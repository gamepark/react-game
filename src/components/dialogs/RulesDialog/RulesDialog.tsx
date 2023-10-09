/** @jsxImportSource @emotion/react */
import { css, ThemeProvider } from '@emotion/react'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import Scrollbars from 'react-custom-scrollbars-2'
import { buttonCss } from '../../../css'
import { Dialog, DialogProps } from '../index'

export type RulesDialogProps = {
  close: () => void
  scrollbar?: boolean
} & DialogProps

export const RulesDialog: FC<RulesDialogProps> = ({ close, children, scrollbar, ...props }: RulesDialogProps) => {
  return (
    <Dialog onBackdropClick={close} {...props}>
      <FontAwesomeIcon icon={faXmark} css={dialogCloseIcon} onClick={close}/>
      <ThemeProvider theme={theme => ({ ...theme, buttons: buttonCss('#002448', '#c2ebf1', '#ade4ec') })}>
        {scrollbar ?
          <Scrollbars autoHeight css={scrollableContainer}>
            {children}
          </Scrollbars>
          : children
        }
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

const scrollableContainer = css`
  max-height: calc(90vh - 6em) !important;

  > div {
    max-height: calc(90vh - 6em) !important;

    // trick to avoid very thin bar on some resolutions with react-custom-scrollbars-2
    scrollbar-width: none;
    -ms-overflow-style: none;

    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
`
