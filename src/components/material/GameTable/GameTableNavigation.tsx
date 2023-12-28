/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus'
import { faMinus } from '@fortawesome/free-solid-svg-icons/faMinus'
import { css } from '@emotion/react'
import { useControls } from 'react-zoom-pan-pinch'

type GameTableNavigationProps = {
  minScale: number
  maxScale: number
}

export const GameTableNavigation: FC<GameTableNavigationProps> = () => {
  const { zoomIn, zoomOut } = useControls()
  return (
    <>
      { !!zoomIn && <FontAwesomeIcon icon={faPlus} css={zoomInStyle} onClick={() => zoomIn(0.3)} />}
      { !!zoomOut && <FontAwesomeIcon icon={faMinus} css={zoomOutStyle} onClick={() => zoomOut(0.3)} />}
    </>
  )
}

const zoomInStyle = css`
  position: fixed;
  top: 2em;
  left: 1em;
  font-size: 3em;
  color: black;
  padding: 0.2em;
  border: 0.2em solid white;
  background-color: white;
  border-radius: 5em;
  height: 1em;
  width: 1em;
  z-index: 1;
  cursor: pointer;
  &:active {
    background-color: lightgray;
    border-color: lightgray;
  }
`

const zoomOutStyle = css`
  position: fixed;
  top: 2em;
  left: 3.5em;
  font-size: 3em;
  color: black;
  padding: 0.2em;
  border: 0.2em solid white;
  background-color: white;
  border-radius: 5em;
  height: 1em;
  width: 1em;
  z-index: 1;
  cursor: pointer;
  &:active {
    background-color: lightgray;
    border-color: lightgray;
  }
`