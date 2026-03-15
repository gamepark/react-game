/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogNavigationProps } from '../../../css'

export const BottomBarNavigation: FC<DialogNavigationProps> = ({ onPrevious, onNext, currentIndex, total }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const primary = theme.palette.primary
  return (
    <div css={[barCss(primary), theme.dialog.navigationCss]}>
      <button css={btnCss(primary)} onClick={onPrevious} disabled={!onPrevious}>
        <FontAwesomeIcon icon={faChevronLeft} css={iconCss}/>
        <span>{t('navigation.previous', 'Previous')}</span>
      </button>
      <div css={counterCss}>
        <div css={dotsCss}>
          {Array.from({ length: Math.min(total, 8) }, (_, i) => (
            <div key={i} css={[dotCss(primary), i === Math.min(currentIndex, 7) && activeDotCss(primary)]}/>
          ))}
        </div>
        <span>{currentIndex + 1} / {total}</span>
      </div>
      <button css={btnCss(primary)} onClick={onNext} disabled={!onNext}>
        <span>{t('navigation.next', 'Next')}</span>
        <FontAwesomeIcon icon={faChevronRight} css={iconCss}/>
      </button>
    </div>
  )
}

const barCss = (primary: string) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 2.4em;
  padding: 0.3em 1em;
  border-top: 1px solid color-mix(in srgb, ${primary} 8%, transparent);
  background: linear-gradient(to top, color-mix(in srgb, ${primary} 4%, transparent), transparent);
`

const btnCss = (primary: string) => css`
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.4em 0.9em;
  border-radius: 2em;
  font-size: 0.78em;
  font-weight: 600;
  font-family: inherit;
  color: ${primary};
  background: transparent;
  border: 1.5px solid color-mix(in srgb, ${primary} 25%, transparent);
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${primary} 10%, transparent);
    border-color: ${primary};
  }

  &:active:not(:disabled) {
    background: color-mix(in srgb, ${primary} 18%, transparent);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
`

const iconCss = css`
  font-size: 0.9em;
`

const counterCss = css`
  font-size: 0.75em;
  color: inherit;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: 600;
`

const dotsCss = css`
  display: flex;
  gap: 0.3em;
`

const dotCss = (primary: string) => css`
  width: 0.35em;
  height: 0.35em;
  border-radius: 50%;
  background: color-mix(in srgb, ${primary} 35%, transparent);
  transition: all 0.2s;
`

const activeDotCss = (primary: string) => css`
  background: ${primary};
  width: 1em;
  border-radius: 0.2em;
`
