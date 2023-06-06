/** @jsxImportSource @emotion/react */
import { FC, useEffect } from 'react'
import { css } from '@emotion/react'
import { TransformComponent, useControls } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { GameMaterialDisplay } from './GameMaterialDisplay'

export type GameTableContentProps = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zoomMin?: number
  zoomMax?: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
}

export const GameTableContent: FC<GameTableContentProps> = (props) => {
  const { perspective, xMin, xMax, yMin, yMax, zoomMax = 1, margin = { left: 0, right: 0, top: 7, bottom: 0 } } = props

  const { centerView } = useControls()
  useEffect(() => {
    const handler = () => centerView()
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
      height: `calc(100% - ${margin.top + margin.bottom}em)`,
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
