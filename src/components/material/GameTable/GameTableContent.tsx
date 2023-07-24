/** @jsxImportSource @emotion/react */
import { FC, useEffect } from 'react'
import { css } from '@emotion/react'
import { TransformComponent, useTransformContext } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { GameMaterialDisplay } from './GameMaterialDisplay'
import { calculateBounds, getMouseBoundedPosition } from '../../../utilities/bounds.util'

export type GameTableContentProps = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  ratio?: number
  zoomMin?: number
  zoomMax?: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
}

export const GameTableContent: FC<GameTableContentProps> = (props) => {
  const { perspective, xMin, xMax, yMin, yMax, ratio = 16 / 9, zoomMax = 1, margin = { left: 0, right: 0, top: 7, bottom: 0 } } = props

  const context = useTransformContext()
  useEffect(() => {
    const handler = () => {
      if (!context.bounds) return
      const { positionX, positionY, scale } = context.transformState
      const bounds = calculateBounds(context, scale)
      const { x, y } = getMouseBoundedPosition(positionX, positionY, bounds, true, 0, 0, context.wrapperComponent)
      context.setTransformState(scale, x, y)
    }
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [])

  return (
    <TransformComponent wrapperStyle={{
      position: 'absolute',
      margin: `${margin.top}em ${margin.right}em ${margin.bottom}em ${margin.left}em`,
      transformStyle: 'preserve-3d',
      height: `calc(min(100%, 100vw / ${ratio}) - ${(margin.top + margin.bottom)}em)`,
      width: `calc(100% - ${margin.left + margin.right}em)`,
      overflow: 'visible'
    }}>
      <div css={[tableCss(xMin, xMax, yMin, yMax), fontSizeCss(zoomMax), perspective && perspectiveCss(perspective)]}>
        <GameMaterialDisplay/>
      </div>
    </TransformComponent>
  )
}

const tableCss = (xMin: number, xMax: number, yMin: number, yMax: number) => css`
  transform-style: preserve-3d;
  width: ${xMax - xMin}em;
  height: ${yMax - yMin}em;

  > * {
    position: absolute;
    top: ${-yMin}em;
    left: ${-xMin}em;
    transform-style: preserve-3d;
  }
`
