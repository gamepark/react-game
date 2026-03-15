/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { DialogNavigationProps } from '../../../css'

export const BottomBarNavigation: FC<DialogNavigationProps> = ({ onPrevious, onNext, currentIndex, total }) => {
  return (
    <div css={barCss}>
      <button css={btnCss} onClick={onPrevious} disabled={!onPrevious}>
        <FontAwesomeIcon icon={faChevronLeft}/>
      </button>
      <span css={counterCss}>{currentIndex + 1} / {total}</span>
      <button css={btnCss} onClick={onNext} disabled={!onNext}>
        <FontAwesomeIcon icon={faChevronRight}/>
      </button>
    </div>
  )
}

const barCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  padding: 0.6em 1.5em;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`

const btnCss = css`
  width: 2.4em;
  height: 2.4em;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  background: transparent;
  color: inherit;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
`

const counterCss = css`
  font-size: 0.85em;
  font-weight: 600;
  min-width: 3.5em;
  text-align: center;
  opacity: 0.6;
`
