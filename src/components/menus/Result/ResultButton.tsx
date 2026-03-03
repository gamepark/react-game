import { faRankingStar } from '@fortawesome/free-solid-svg-icons/faRankingStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'

export const ResultButton = (props: HTMLAttributes<HTMLButtonElement>) => {
  const { t } = useTranslation('common')

  return (
    <button css={[menuButtonCss, paletteMenuButtonCss]} {...props}>
      <FontAwesomeIcon icon={faRankingStar}/>
      {t('result.button')}
    </button>
  )
}
