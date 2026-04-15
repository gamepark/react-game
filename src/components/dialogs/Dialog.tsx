import { css, Interpolation, keyframes, ThemeProvider, useTheme } from '@emotion/react'
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
  const theme = useTheme()
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

  // Layered button styling for buttons rendered inside this dialog:
  //   1. dialogButtonBaseCss   — structural rules (padding, font-weight,
  //                              border-radius, ...). Always applied so
  //                              games never lose layout when they only
  //                              tweak colours.
  //   2. theme.buttons         — game-wide button recipe override.
  //   3. theme.dialog.buttons  — dialog-specific override.
  // Falls back to onSurfaceButtonCss visuals via ThemeButton when the
  // game does not provide any theme.buttons.
  const resolvedDialogButtonsCss = [dialogButtonBaseCss, theme.buttons, theme.dialog.buttons]
  const dialogContent = (
    <div onClick={event => event.stopPropagation()} css={[dialogCss, open ? (theme.dialog.openAnimation ?? dialogShow(transitionDelay)) : (theme.dialog.closeAnimation ?? dialogHide(transitionDelay)), theme.dialog.container]} {...props}>
      {children}
    </div>
  )

  return createPortal(
    <div css={[backdropStyle(transitionDelay), !open && hide(transitionDelay), backdropCss]} onClick={event => !justDisplayed && onBackdropClick?.(event)}>
      <ThemeProvider theme={t => ({ ...t, buttons: resolvedDialogButtonsCss })}>{dialogContent}</ThemeProvider>
    </div>,
    root
  )
}

// Structural base — applied to every button rendered inside a Dialog
// regardless of the active theme. Games override visuals via
// theme.buttons / theme.dialog.buttons but always inherit the
// structural rules (padding, border-radius, cursor, ...) from here so
// they don't have to redeclare them.
const dialogButtonBaseCss = css`
  cursor: pointer;
  padding: 0.3em 0.9em;
  border-radius: 2em;
  border: 0.05em solid currentColor;
  background: transparent;
  font-weight: 600;

  &:focus { outline: none; }

  &:disabled {
    color: #555555;
    border-color: #555555;
    cursor: auto;
    opacity: 0.5;
  }
`

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

const scaleIn = keyframes`
  from {
    opacity: 0;
    scale: 0.92;
  }
  to {
    opacity: 1;
    scale: 1;
  }
`

const scaleOut = keyframes`
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0;
    scale: 0.92;
  }
`

const dialogShow = (transitionDelay: number) => css`
  animation: ${scaleIn} ${transitionDelay}s ease-out forwards;
`

const dialogHide = (transitionDelay: number) => css`
  animation: ${scaleOut} ${transitionDelay}s ease-in forwards;
`

const dialogCss = css`
  position: relative;
  background-color: var(--gp-dialog-bg);
  color: var(--gp-dialog-color);
  padding: 1em;
  border-radius: 1em;
  box-shadow: 0 0 0.2em black;
`
