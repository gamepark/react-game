import { css } from '@emotion/react'
import Avatar from '@gamepark/avataaars'
import { useMessageAuthor } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'

export const ChatMessageAuthor = ({ author }: { author: string }) => {
  const { t } = useTranslation()
  const { avatar, name } = useMessageAuthor(author)

  return <>
    <Avatar style={{ width: '2.25em', height: '2.25em', position: 'absolute', left: '0' }} circle {...avatar}/>
    {name && <p css={[authorCss]}>{name}</p>}
    {!name && <p css={[authorCss, anonymous]}>{t('Anonymous')}</p>}
  </>
}

const authorCss = css`
  font-weight: bold;
  line-height: 1.5;
  margin: 4px 0 0;
  font-size: 0.7em
`

const anonymous = css`
  font-style: italic;
  color: gray;
`