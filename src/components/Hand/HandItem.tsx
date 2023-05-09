/** @jsxImportSource @emotion/react */
import { css, keyframes, SerializedStyles } from '@emotion/react'
import { WithConditionalCSSProp } from '@emotion/react/types/jsx-namespace'
import { forwardRef, HTMLAttributes } from 'react'
import { CssAnimation } from '../Draggable'

export type HandItemProps = {
  angle: number // Angle of the rotation
  rotationOrigin?: number // The distance between the center of a card and the center of the circle used to spread the cards (proportionally to the card height)
  sizeRatio?: number
  projection?: boolean
  animation?: HandItemAnimation
  hoverStyle?: SerializedStyles
  itemSelector?: string
} & HTMLAttributes<HTMLDivElement> & WithConditionalCSSProp<HTMLDivElement>

export type HandItemAnimation = CssAnimation & {
  fromNeutralPosition?: boolean
  toNeutralPosition?: boolean
}

export const HandItem = forwardRef<HTMLDivElement, HandItemProps>((
  { children, rotationOrigin = 10, angle, sizeRatio = 2.5 / 3.5, projection, animation, hoverStyle, itemSelector, ...props }, ref) => {
  const projectionStyle = css`
    transform: translateX(${Math.sin(angle * Math.PI / 180) * (rotationOrigin * 100 - 50) / sizeRatio}%);
  `
  const transformation = css`
    &:before, > * {
      transform-origin: center ${rotationOrigin * 100}%;
      transform-style: preserve-3d;
      ${projection ? projectionStyle : css`transform: rotate(${angle}deg)`};
      ${animation && getAnimationStyle(animation)};
      will-change: transform;
    }
  `
  return (
    <div ref={ref} css={[style, transformation, hoverStyle && !animation && getHoverStyle(hoverStyle, projectionStyle, itemSelector)]}
         {...props}>
      <div css={childStyle}>
        {children}
      </div>
    </div>
  )
})

const style = css`
  pointer-events: none;
  position: absolute;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    pointer-events: auto;
  }
`

const childStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  pointer-events: auto;
`

const getAnimationStyle = ({ seconds, delay = 0, timingFunction = 'ease-in-out', fromNeutralPosition, toNeutralPosition }: HandItemAnimation) => {
  if (fromNeutralPosition) {
    return css`animation: ${fromTransformNone(delay / (delay + seconds))} ${delay + seconds}s ${timingFunction} forwards`
  } else if (toNeutralPosition) {
    return css`animation: ${toTransformNone} ${delay + seconds}s ${timingFunction} forwards`
  } else {
    return css`transition: transform ${seconds}s ${delay}s ${timingFunction};`
  }
}

const fromTransformNone = (delay: number) => keyframes`
  from {
    transform: none
  }
${delay && `${delay * 100}% {transform: none}`}
`

const toTransformNone = keyframes`
  to {
    transform: none
  }
`

const getHoverStyle = (hoverStyle: SerializedStyles, projection: SerializedStyles, itemSelector = '> * > *'): SerializedStyles => css`
  @media (hover) {
    &:hover {
      > * {
        ${projection};
        z-index: 1;
      }

      ${itemSelector} {
        ${hoverStyle};
      }
    }
  }
`
