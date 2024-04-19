/** @jsxImportSource @emotion/react */
import { css, Interpolation, keyframes, Theme } from '@emotion/react'
import { HTMLAttributes, MouseEventHandler, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type DialogProps = {
  open: boolean
  backdropCss?: Interpolation<any>,
  onBackdropClick?: MouseEventHandler<HTMLDivElement>
  transitionDelay?: number
  rootId?: string
} & HTMLAttributes<HTMLDivElement>

export const Dialog = ({ children, open, backdropCss, onBackdropClick, transitionDelay = 0.3, rootId = 'root', ...props }: DialogProps) => {
  const [display, setDisplay] = useState(open)
  // When we open the dialog with use-long-press, Chrome mobile generates a click event on the backdrop even though the pointer down event
  // was done before the dialog existed. It causes the dialog to close immediately. We prevent any backdrop click for 300ms to workaround this issue.
  const [justDisplayed, setJustDisplayed] = useState(false)

  useEffect(() => {
    if (open) {
      setDisplay(true)
      setJustDisplayed(true)
      const timeout = setTimeout(() => setJustDisplayed(false), 300)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => setDisplay(false), transitionDelay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [open, transitionDelay])

  if (!display) return null

  const root = document.getElementById(rootId)
  if (!root) {
    console.error('Dialog cannot be displayed because this element id does not exists:', rootId)
    return null
  }

  return createPortal(
    <div css={[backdropStyle(transitionDelay), !open && hide(transitionDelay), backdropCss]} onClick={event => !justDisplayed && onBackdropClick?.(event)}>
      <div onClick={event => event.stopPropagation()} css={theme => dialogCss(theme)} {...props}>
        {children}
      </div>
    </div>,
    root
  )
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`

const backdropStyle = (transitionDelay: number) => css`
  position: fixed;
  top: 0;
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  transition: opacity ${transitionDelay}s;
  animation: ${fadeIn} ${transitionDelay}s forwards;
  display: flex;
  align-items: center;
  justify-content: center;
`

const hide = (transitionDelay: number) => css`
  animation: ${fadeOut} ${transitionDelay}s forwards;
  pointer-events: none;
`

const dialogCss = (theme: Theme) => css`
  position: relative;
  background-color: ${theme.dialog.backgroundColor};
  color: ${theme.dialog.color};
  padding: 1em;
  border-radius: 1em;
  box-shadow: 0 0 0.2em black;
`
