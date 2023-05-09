/** @jsxImportSource @emotion/react */
import { faRankingStar } from '@fortawesome/free-solid-svg-icons/faRankingStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { menuButtonCss } from '@gamepark/react-client'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

export function ResultButton(props: HTMLAttributes<HTMLButtonElement>) {
  const { t } = useTranslation()

  return (
    <button css={menuButtonCss} {...props}>
      <FontAwesomeIcon icon={faRankingStar}/>
      {t('result.button')}
    </button>
  )
}