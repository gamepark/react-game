/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { css } from '@emotion/react'
import { TransformComponent } from 'react-zoom-pan-pinch'
import { fontSizeCss, perspectiveCss } from '../../../css'
import { GameMaterialDisplay } from './GameMaterialDisplay'
import { MaterialDescription } from '../MaterialDescription'
import { ItemLocatorCreator } from '../../../locators'

export type GameTableContentProps<MaterialType extends number = number, LocationType extends number = number> = {
  material: Record<MaterialType, MaterialDescription>
  locators: Record<LocationType, ItemLocatorCreator>
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zoomMin?: number
  zoomMax?: number
  perspective?: number
  margin?: { left: number, top: number, right: number, bottom: number }
}

const GameTableContent: FC<GameTableContentProps> = (props) => {
  const { material, locators, perspective, xMin, xMax, yMin, yMax, zoomMax = 1, margin = { left: 0, right: 0, top: 7, bottom: 0 } } = props
  
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
        <GameMaterialDisplay locators={locators} material={material}/>
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

export {
  GameTableContent
}