/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faSearchMinus } from '@fortawesome/free-solid-svg-icons/faSearchMinus'
import { faSearchPlus } from '@fortawesome/free-solid-svg-icons/faSearchPlus'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, HTMLAttributes, useState } from 'react'
import { createPortal } from 'react-dom'
import { useControls, useTransformEffect } from 'react-zoom-pan-pinch'
import { buttonResetCss } from '../../../css'

export const GameTableNavigation: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  const { zoomIn, zoomOut } = useControls()
  const [isMin, setIsMin] = useState(false)
  const [isMax, setIsMax] = useState(false)
  useTransformEffect(({ state, instance }) => {
    setIsMin(state.scale === instance.props.minScale)
    setIsMax(state.scale === instance.props.maxScale)
  })
  return createPortal(
    <div css={navigationContainer} {...props}>
      <button css={button} onClick={() => zoomIn(0.1)} disabled={isMax}>
        <FontAwesomeIcon icon={faSearchPlus} css={iconCss}/>
      </button>
      <button css={button} onClick={() => zoomOut(0.1)} disabled={isMin}>
        <FontAwesomeIcon icon={faSearchMinus} css={iconCss}/>
      </button>
    </div>,
    document.getElementById('root')!
  )
}

const navigationContainer = css`
  position: fixed;
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
