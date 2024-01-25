/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Avatar from '@gamepark/avataaars'
import { useMessageAuthor } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'

export const ChatMessageAuthor = ({ author }: { author: string }) => {
  const { t } = useTranslation()
  const { avatar, name } = useMessageAuthor(author)

  return <>
    <Avatar style={{ width: '48px', height: '48px', position: 'absolute', left: '-3px' }} circle {...avatar}/>
    {name && <p css={[authorCss]}>{name}</p>}
    {!name && <p css={[authorCss, anonymous]}>{t('Anonymous')}</p>}
  </>
}

const authorCss = css`
  font-weight: bold;
  line-height: 1.5;
  margin: 4px 0 0;
`

const anonymous = css`
  font-style: italic;
  color: gray;
`