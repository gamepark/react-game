/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { faRankingStar } from '@fortawesome/free-solid-svg-icons/faRankingStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { useRules } from '../../../hooks'
import { MenuPopButton } from '../Menu/MenuPopButton'

export const ResultPopButton = (props: HTMLAttributes<HTMLButtonElement>) => {
  const { t } = useTranslation()
  const gameOver = useRules()?.isOver()

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