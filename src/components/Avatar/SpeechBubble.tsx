import { css, Interpolation, Theme } from '@emotion/react'
import { FC, HTMLAttributes, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export enum SpeechBubbleDirection {
  TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
}

export type SpeechBubbleProps = {
  /**
   * Where the bubble opens relatively to its anchor. Defaults to the direction that keeps the bubble
   * inside the screen, deduced from the anchor position in the viewport (see {@link getSpeechBubbleDirection}).
   */
  direction?: SpeechBubbleDirection
  parent?: string
  css?: Interpolation<Theme>
} & HTMLAttributes<HTMLParagraphElement>

export const SpeechBubble: FC<SpeechBubbleProps> = ({ children, direction, parent, css, ...props }) => {
  const ref = useRef<HTMLParagraphElement>(null)
  const [autoDirection, setAutoDirection] = useState(SpeechBubbleDirection.TOP_LEFT)
  useLayoutEffect(() => {
    if (direction !== undefined) return
    // The anchor is the element the bubble is displayed next to: the avatar, or the portal target.
    const anchor = ref.current?.parentElement
    if (anchor) setAutoDirection(getSpeechBubbleDirection(anchor))
  }, [direction, children])
  const speechBubble = <p ref={ref} css={[speechBubbleCss, getDirectionStyle(direction ?? autoDirection), css]} {...props}>{children}</p>
  if (parent) {
    const parentElement = document.getElementById(parent)
    if (parentElement) {
      return createPortal(speechBubble, parentElement)
    }
  }
  return speechBubble
}

/**
 * Direction a speech bubble should open to, so that it stays inside the screen, given the position of the
 * element it is anchored to.
 */
export const getSpeechBubbleDirection = (anchor: Element): SpeechBubbleDirection => {
  const rect = anchor.getBoundingClientRect()
  const left = rect.left / (window.visualViewport?.width ?? window.innerWidth)
  const top = rect.top / (window.visualViewport?.height ?? window.innerHeight)
  const isLeft = (left > 0.2 && left < 0.5) || left > 0.8
  const isTop = (top > 0.2 && top < 0.5) || top > 0.8
  if (isLeft) {
    return isTop ? SpeechBubbleDirection.TOP_LEFT : SpeechBubbleDirection.BOTTOM_LEFT
  } else {
    return isTop ? SpeechBubbleDirection.TOP_RIGHT : SpeechBubbleDirection.BOTTOM_RIGHT
  }
}

const speechBubbleCss = css`
  position: absolute;
  width: max-content;
  max-width: 15em;
  background: white;
  border-radius: .4em;
  font-size: calc(3em * var(--gp-scale));
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
