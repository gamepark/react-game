/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { faRankingStar } from '@fortawesome/free-solid-svg-icons/faRankingStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GamePageState } from '@gamepark/react-client'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { MenuPopButton } from '../Menu/MenuPopButton'

export const ResultPopButton = (props: HTMLAttributes<HTMLButtonElement>) => {
  const { t } = useTranslation()
  const gameOver = useSelector((state: GamePageState) => state.gameOver && !state.actions?.some(action => action.animation))

  return (
    <MenuPopButton pop={gameOver} css={style} title={t('result.button')!} {...props}>
      <FontAwesomeIcon icon={faRankingStar} css={shakeAnimation}/>
    </MenuPopButton>
  )
}

const style = css`
  background: white;
  color: #28b8ce;

  &:focus, &:hover {
    background: #f0fbfc;
  }

  &:active {
    background: #dbf5f8;
  }
`

const shake = keyframes`
  1%, 9% {
    transform: translate(-1px, 0);
  }

  2%, 8% {
    transform: translate(2px, 0);
  }

  3%, 5%, 7% {
    transform: translate(-4px, 0);
  }

  4%, 6% {
    transform: translate(4px, 0);
  }
  10%, 100% {
    transform: none;
  }
`

const shakeAnimation = css`
  animation: ${shake} 1s alternate infinite;
`