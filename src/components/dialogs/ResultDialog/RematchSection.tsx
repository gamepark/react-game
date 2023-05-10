/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faRepeat } from '@fortawesome/free-solid-svg-icons/faRepeat'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { menuButtonCss, useRematch } from '@gamepark/react-client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RematchDisplay } from './RematchDisplay'

type Props = {
  openDialog: () => void
}

export const RematchSection = ({ openDialog }: Props) => {
  const { t } = useTranslation()
  const { game, rematch } = useRematch()
  useEffect(() => {
    if (game?.rematch) openDialog()
  }, [game?.rematch])
  return (
    <div>
      {game?.canRematch &&
        <button css={[menuButtonCss, css`display: inline-block`]} onClick={() => rematch()}>
          <FontAwesomeIcon icon={faRepeat}/>
          {t('rematch.button')}
        </button>
      }
      {game?.rematch && <RematchDisplay rematch={game.rematch}/>}
    </div>
  )
}
