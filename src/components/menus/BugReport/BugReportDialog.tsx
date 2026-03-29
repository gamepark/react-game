import { css } from '@emotion/react'
import { trpcClient } from '@gamepark/react-client'
import { TRPCClientError } from '@trpc/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogProps } from '../../dialogs'
import { menuButtonCss, menuDialogCss, paletteMenuButtonCss } from '../menuCss'

const query = new URLSearchParams(window.location.search)
const gameId = query.get('game')
const locale = query.get('locale') || 'en'

const categories = [
  { key: 'GAME_LOGIC', label: 'Game logic' },
  { key: 'UI', label: 'Display / UI' },
  { key: 'PERFORMANCE', label: 'Performance' },
  { key: 'CRASH', label: 'Crash / freeze' },
  { key: 'OTHER', label: 'Other' }
] as const

type State = 'FORM' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'

type Props = Pick<DialogProps, 'open'> & { onClose: () => void }

export const BugReportDialog = ({ open, onClose }: Props) => {
  const { t } = useTranslation('common')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [state, setState] = useState<State>('FORM')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!gameId || description.trim().length < 10) return
    setState('SUBMITTING')
    try {
      await trpcClient.bugReport.submit.mutate({
        gameId,
        description: description.trim(),
        category: category ? (category as any) : undefined,
        browserInfo: {
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          locale
        }
      })
      setState('SUCCESS')
    } catch (e) {
      setState('ERROR')
      if (e instanceof TRPCClientError && e.data?.code === 'TOO_MANY_REQUESTS') {
        setErrorMessage(t('bug.dialog.cooldown', 'Please wait before submitting another report.'))
      } else {
        setErrorMessage(t('bug.dialog.error', 'Failed to submit. Please try again.'))
      }
    }
  }

  const handleClose = () => {
    if (state !== 'SUBMITTING') {
      setDescription('')
      setCategory('')
      setState('FORM')
      setErrorMessage('')
      onClose()
    }
  }

  const themedButtonCss = [menuButtonCss, paletteMenuButtonCss, inDialogButton]

  return (
    <Dialog open={open} css={[menuDialogCss, dialogWidthCss]} onBackdropClick={handleClose}>
      {state === 'SUCCESS' ? (
        <>
          <h2>{t('bug.dialog.success.title', 'Thank you!')}</h2>
          <p>{t('bug.dialog.success.message', "Your report has been submitted. We'll investigate.")}</p>
          <button css={themedButtonCss} onClick={handleClose}>OK</button>
        </>
      ) : state === 'ERROR' ? (
        <>
          <h2>Error</h2>
          <p>{errorMessage}</p>
          <div css={buttonLineCss}>
            <button css={themedButtonCss} onClick={handleClose}>{t('Cancel', 'Cancel')}</button>
            <button css={themedButtonCss} onClick={() => setState('FORM')}>
              {t('bug.dialog.retry', 'Retry')}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>{t('bug.dialog.title', 'Report a Bug')}</h2>
          <p css={hintCss}>{t('bug.dialog.description.hint', 'What happened? What did you expect? (min. 10 characters)')}</p>
          <textarea
            css={textareaCss}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('bug.dialog.description.label', 'Describe the issue') ?? ''}
            rows={4}
            maxLength={2000}
          />
          <select css={selectCss} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('bug.dialog.category.label', 'Category (optional)')}</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {t(`bug.dialog.category.${c.key}`, c.label)}
              </option>
            ))}
          </select>
          <div css={buttonLineCss}>
            <button css={themedButtonCss} onClick={handleClose}>{t('Cancel', 'Cancel')}</button>
            <button
              css={themedButtonCss}
              onClick={handleSubmit}
              disabled={description.trim().length < 10 || state === 'SUBMITTING'}
            >
              {state === 'SUBMITTING'
                ? t('bug.dialog.submitting', 'Submitting...')
                : t('bug.dialog.submit', 'Submit report')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}

const dialogWidthCss = css`
  max-width: 90dvw;
  min-width: min(25em, 90dvw);
`

const textareaCss = css`
  width: 100%;
  min-height: 5em;
  padding: 0.5em;
  font-family: inherit;
  font-size: 0.85em;
  border-radius: 0.3em;
  border: 0.05em solid currentColor;
  background: transparent;
  color: inherit;
  resize: vertical;
  box-sizing: border-box;

  &::placeholder {
    opacity: 0.6;
  }
`

const selectCss = css`
  width: 100%;
  padding: 0.4em 0.5em;
  font-family: inherit;
  font-size: 0.85em;
  border-radius: 0.3em;
  border: 0.05em solid currentColor;
  background: transparent;
  color: inherit;
  margin: 0.5em 0;
`

const hintCss = css`
  font-size: 0.8em;
  opacity: 0.7;
`

const buttonLineCss = css`
  margin-top: 1em;
  display: flex;
  justify-content: space-between;
`

const inDialogButton = css`
  margin: 0;
`
