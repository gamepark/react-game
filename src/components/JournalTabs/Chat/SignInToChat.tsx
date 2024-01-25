/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { PLATFORM_URI } from '@gamepark/react-client'
import { useTranslation } from 'react-i18next'
import { buttonResetCss } from '../../../css'

export const SignInToChat = () => {
  const { t } = useTranslation()
  const query = new URLSearchParams(window.location.search)
  const locale = query.get('locale') || 'en'
  return (
    <div css={style}>
      <p css={textCss}>{t('sign-in-to-chat')}</p>
      <button css={[buttonResetCss, signInButtonCss]}
              onClick={() => window.location.href = `${PLATFORM_URI}/${locale}/auth/sign-in?callbackUrl=${encodeURIComponent(window.location.href)}`}>
        {t('Sign in')}
      </button>
    </div>
  )
}

const style = css`
  width: 100%;
  padding: 8px 16px;
  text-align: center;
`

const textCss = css`
  line-height: 1.5;
  margin: 0;
  font-weight: bold;
`

const signInButtonCss = css`
  padding: 0.2em 0.5em;
  border-radius: 2em;
  border: 0.05em solid #002448;
  color: #002448;
  background: transparent;
  font-size: 1.25em;

  &:focus, &:hover {
    background: #c2ebf1;
  }

  &:active {
    background: #ade4ec;
  }
`