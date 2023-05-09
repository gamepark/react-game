/** @jsxImportSource @emotion/react */
import { css, Interpolation, keyframes } from '@emotion/react'
import { HTMLAttributes, MouseEventHandler, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type DialogProps = {
  open: boolean
  backdropCss?: Interpolation<any>,
  onBackdropClick?: MouseEventHandler<HTMLDivElement>
  transitionDelay?: number
  rootId?: string
} & HTMLAttributes<HTMLDivElement>

export function Dialog({ children, open, backdropCss, onBackdropClick, transitionDelay = 0.3, rootId = 'root', ...props }: DialogProps) {
  const [display, setDisplay] = useState(open)

  useEffect(() => {
    if (open) {
      setDisplay(true)
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
    <div css={[backdropStyle(transitionDelay), !open && hide(transitionDelay), backdropCss]} onClick={onBackdropClick}>
      <div onClick={event => event.stopPropagation()} {...props}>
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
  height: 100vh;
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

export const dialogDefaultCss = css`
  position: relative;
  background-color: #f0fbfc;
  color: #002448;
  font-size: 3.2em;
  padding: 1em;
  border-radius: 1em;
  border: 0.2em solid #28B8CE;
  box-shadow: 0 0 0.2em black;
  font-family: "Mulish", sans-serif;
`
