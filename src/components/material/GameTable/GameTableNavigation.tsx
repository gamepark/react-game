/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearchPlus } from '@fortawesome/free-solid-svg-icons/faSearchPlus'
import { faSearchMinus } from '@fortawesome/free-solid-svg-icons/faSearchMinus'
import { css } from '@emotion/react'
import { useControls } from 'react-zoom-pan-pinch'

type GameTableNavigationProps = {
} & HTMLAttributes<HTMLDivElement>

export const GameTableNavigation: FC<GameTableNavigationProps> = (props) => {
  const { zoomIn, zoomOut } = useControls()
  return (
    <div css={navigationContainer} {...props} >
      { !!zoomIn && <FontAwesomeIcon icon={faSearchPlus} css={[button]} onClick={() => zoomIn(0.3)} />}
      { !!zoomOut && <FontAwesomeIcon icon={faSearchMinus} css={[button, zoomOutStyle]} onClick={() => zoomOut(0.3)} />}
    </div>
  )
}

const navigationContainer = css`
  position: fixed;
  top: 8em;
  left: 1em;
  transform: translateZ(100em);
`

const button = css`
  font-size: 2.5em;
  padding: 0.5em;
  color: #28B8CE;
  border: 0.1em solid #28B8CE;
  border-radius: 5em;
  background-color: #f0fbfc;
  height: 1em;
  width: 1em;
  cursor: pointer;

  &:active {
    color: black;
    background-color: lightgray;
  }
`

const zoomOutStyle = css`
  position: absolute;
  left: 2.5em;
`