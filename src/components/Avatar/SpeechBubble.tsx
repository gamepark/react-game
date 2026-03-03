import { css, Interpolation, Theme } from '@emotion/react'
import { FC, HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'

export enum SpeechBubbleDirection {
  TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
}

export type SpeechBubbleProps = {
  direction?: SpeechBubbleDirection
  parent?: string
  css?: Interpolation<Theme>
} & HTMLAttributes<HTMLParagraphElement>

export const SpeechBubble: FC<SpeechBubbleProps> = ({ children, direction = SpeechBubbleDirection.TOP_LEFT, parent, css, ...props }) => {
  const speechBubble = <p css={[speechBubbleCss, getDirectionStyle(direction), css]} {...props}>{children}</p>
  if (parent) {
    const parentElement = document.getElementById(parent)
    if (parentElement) {
      return createPortal(speechBubble, parentElement)
    }
  }
  return speechBubble
}

const speechBubbleCss = css`
  position: absolute;
  width: max-content;
  max-width: 15em;
  background: white;
  border-radius: .4em;
  font-size: 3em;
  padding: 0.2em 0.4em;
  margin: 0;
  z-index: 500;
  pointer-events: none;
  filter:drop-shadow(0 0 0.1rem black);

  :after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-color: transparent;
  }
`

const getDirectionStyle = (direction: SpeechBubbleDirection) => {
  switch (direction) {
    case SpeechBubbleDirection.TOP_LEFT:
      return [topBubble, leftBubble, rotateArrow]
    case SpeechBubbleDirection.TOP_RIGHT:
      return [topBubble, rightBubble, reverseRotateArrow]
    case SpeechBubbleDirection.BOTTOM_LEFT:
      return [bottomBubble, leftBubble, reverseRotateArrow]
    case SpeechBubbleDirection.BOTTOM_RIGHT:
      return [bottomBubble, rightBubble, rotateArrow]
  }
}

const topBubble = css`
  bottom: 45%;

  :after {
    bottom: 0;
    border-top-width: 0.4em;
    border-bottom: 0;
    margin-bottom: 0.3em;
  }
`

const bottomBubble = css`
  top: 45%;

  :after {
    top: 0;
    border-bottom-width: 0.4em;
    border-top: 0;
    margin-top: 0.3em;
  }
`

const leftBubble = css`
  left: -0.3em;
  transform: translateX(-100%);

  :after {
    right: 0;
    border-left-color: white;
    border-left-width: 0.6em;
    border-right: 0;
    margin-right: -0.5em;
  }
`

const rightBubble = css`
  right: -0.3em;
  transform: translateX(100%);

  :after {
    left: 0;
    border-right-color: white;
    border-right-width: 0.6em;
    border-left: 0;
    margin-left: -0.5em;
  }
`

const rotateArrow = css`
  :after {
    transform: rotate(15deg);
  }
`

const reverseRotateArrow = css`
  :after {
    transform: rotate(-15deg);
  }
`
