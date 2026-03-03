import { css } from '@emotion/react'
import { faSearchMinus } from '@fortawesome/free-solid-svg-icons/faSearchMinus'
import { faSearchPlus } from '@fortawesome/free-solid-svg-icons/faSearchPlus'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, HTMLAttributes, useState } from 'react'
import { createPortal } from 'react-dom'
import { useControls, useTransformEffect } from 'react-zoom-pan-pinch'
import { buttonResetCss } from '../../../css'
import { useGameTableContext } from './GameTableContext'

type GameTableNavigationProps = {
  scaleStep?: number
} & HTMLAttributes<HTMLDivElement>

export const GameTableNavigation: FC<GameTableNavigationProps> = (props) => {
  const { zoom } = useGameTableContext()
  if (!zoom) return null
  return <GameTableNavigationInner {...props} />
}

const GameTableNavigationInner: FC<GameTableNavigationProps> = (props) => {
  const { scaleStep = 0.1, ...rest } = props
  const { zoomIn, zoomOut } = useControls()
  const [isMin, setIsMin] = useState(false)
  const [isMax, setIsMax] = useState(false)
  useTransformEffect(({ state, instance }) => {
    setIsMin(state.scale === instance.props.minScale)
    setIsMax(state.scale === instance.props.maxScale)
  })
  return createPortal(
    <div css={navigationContainer} {...rest}>
      <button css={button} onClick={() => zoomIn(scaleStep)} disabled={isMax}>
        <FontAwesomeIcon icon={faSearchPlus} css={iconCss}/>
      </button>
      <button css={button} onClick={() => zoomOut(scaleStep)} disabled={isMin}>
        <FontAwesomeIcon icon={faSearchMinus} css={iconCss}/>
      </button>
    </div>,
    document.getElementById('root')!
  )
}

const navigationContainer = css`
  position: fixed;
  z-index: 1;
  display: flex;
  gap: 1em;
  top: 8em;
  left: 1em;
  color: white;
  transform: translateZ(100em);
`

const button = [buttonResetCss, css`
  font-size: 3em;
  height: 2em;
  width: 2em;
  border-radius: 2em;
  transition: transform 0.1s ease-in-out;
  border: 0.1em solid white;
  color: inherit;
  background: transparent;
  padding: 0;
  filter: drop-shadow(0.1em 0.1em 0.05em black);

  &:disabled {
    color: #a0a0a0;
    border-color: #a0a0a0;
  }

  &:not(:disabled) {
    &:focus, &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(1.05);
      background-color: rgba(0, 0, 0, 0.5);
    }
  }

`]

const iconCss = css`
  color: inherit;
`
