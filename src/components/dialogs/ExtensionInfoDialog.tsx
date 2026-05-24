/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RulesDialog } from './RulesDialog'

export type ExtensionInfoDialogProps = {
  /** One node per extension. Each node renders its own popup content (title, text, cards…). */
  popups: ReactNode[]
  /** Stable key for the sessionStorage dismiss flag. Include the extension combo so a new
   *  configuration (different active extensions) re-triggers the popup. */
  storageKey: string
}

const isDismissed = (key: string): boolean => {
  try {
    return sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

const markDismissed = (key: string): void => {
  try {
    sessionStorage.setItem(key, 'true')
  } catch {
    // ignore (private mode, quota, …)
  }
}

/**
 * Generic carousel-style "you are playing with extension(s)" popup.
 *
 * The framework handles:
 *   - the dialog/modal wrapper (close button via `theme.dialog.closeButton`/`closeIcon`)
 *   - a dedicated navigation bar tailored to this dialog (see ExtensionNav below):
 *     * single popup    → just a centered "Close" button (no useless Previous/Next)
 *     * multiple popups → Previous + dots + Next as long as we're not on the last page;
 *                         on the last page Next becomes "Close" (still keeps Previous)
 *   - the `sessionStorage` gate ("show once per tab session", F5-safe)
 *
 * The game just passes:
 *   - `popups`: a ReactNode per extension, fully self-rendered (title, body, cards…)
 *   - `storageKey`: a stable identifier whose composition encodes the active extension combo
 *
 * Pass an empty `popups` array (or omit the component) when no extension is active.
 */
export const ExtensionInfoDialog: FC<ExtensionInfoDialogProps> = ({ popups, storageKey }) => {
  const theme = useTheme()
  const [open, setOpen] = useState<boolean>(() => popups.length > 0 && !isDismissed(storageKey))
  const [index, setIndex] = useState(0)

  const total = popups.length
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, total - 1))

  const close = useCallback(() => {
    markDismissed(storageKey)
    setOpen(false)
  }, [storageKey])

  if (total === 0) return null

  /* CSS cascade for the dialog container:
   *   1. <Dialog> applies `theme.dialog.container` automatically — that's
   *      the game-wide chrome (background, padding, dotted outline, fonts…).
   *      It lands by default, we don't re-apply it here.
   *   2. `containerCss` below adds the extension-flavour defaults (sane
   *      width / max-height for a card carousel).
   *   3. `theme.extensionDialog.container` (if any) lands last and wins —
   *      games override width, max-height, etc. through the theme rather
   *      than props. Emotion's array stacking handles precedence, no flag
   *      needed.
   */
  return (
    <RulesDialog open={open} close={close} css={[containerCss, theme.extensionDialog?.container]}>
      <div css={layoutCss}>
        <div css={contentCss}>
          {popups[safeIndex]}
        </div>
        <ExtensionNav
          total={total}
          currentIndex={safeIndex}
          onPrevious={safeIndex > 0 ? () => setIndex(i => i - 1) : undefined}
          onNext={safeIndex < total - 1 ? () => setIndex(i => i + 1) : undefined}
          onClose={close}
        />
      </div>
    </RulesDialog>
  )
}

/* ----- Extension-specific navigation bar -----
 *
 * Layout rules:
 *   - total === 1                    → just a centered "Close" button
 *   - total > 1, not last slide      → Previous (left) · dots+counter (centre) · Next (right)
 *   - total > 1, last slide          → Previous (left) · dots+counter (centre) · Close (right)
 *
 * Kept inline (private to this file) rather than exposed as a framework
 * navigation slot: the buttons / labels / signals are dialog-specific and
 * would only confuse the wider DialogNavigationProps contract used by
 * help/rules dialogs.
 */
type ExtensionNavProps = {
  total: number
  currentIndex: number
  onPrevious?: () => void
  onNext?: () => void
  onClose: () => void
}

const ExtensionNav: FC<ExtensionNavProps> = ({ total, currentIndex, onPrevious, onNext, onClose }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const primary = theme.palette.primary

  if (total === 1) {
    return (
      <div css={[barCss(primary), singleSlideBarCss, theme.dialog.navigationCss]}>
        <button css={btnCss(primary)} onClick={onClose}>
          <span>{t('Close', { ns: 'common' })}</span>
        </button>
      </div>
    )
  }

  const isLast = currentIndex === total - 1
  return (
    <div css={[barCss(primary), theme.dialog.navigationCss]}>
      <button css={btnCss(primary)} onClick={onPrevious} disabled={!onPrevious}>
        <FontAwesomeIcon icon={faChevronLeft} css={iconCss}/>
        <span>{t('Previous', { ns: 'common' })}</span>
      </button>
      <div css={counterCss}>
        <div css={dotsCss}>
          {Array.from({ length: Math.min(total, 8) }, (_, i) => (
            <div key={i} css={[dotCss(primary), i === Math.min(currentIndex, 7) && activeDotCss(primary)]}/>
          ))}
        </div>
        <span>{currentIndex + 1} / {total}</span>
      </div>
      {isLast ? (
        <button css={btnCss(primary)} onClick={onClose}>
          <span>{t('Close', { ns: 'common' })}</span>
        </button>
      ) : (
        <button css={btnCss(primary)} onClick={onNext} disabled={!onNext}>
          <span>{t('Next', { ns: 'common' })}</span>
          <FontAwesomeIcon icon={faChevronRight} css={iconCss}/>
        </button>
      )}
    </div>
  )
}

const containerCss = css`
  /* Default sizing for the extension carousel — comfortably fits a 4-card
     grid plus prose. Games widen / shrink / switch to width: auto via
     theme.extensionDialog.container, which lands after this in the
     Emotion cascade. */
  width: min(90vw, 70em);
  width: min(90dvw, 70em);
`

const layoutCss = css`
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  max-height: 90dvh;
`

/* Same em base as the framework's help dialogs (helpDialogContentCss) so the popup body
   reads at the same scale as the rest of the rules UI, and the navigation (its own 2.4em)
   lands at the expected size right below. */
const contentCss = css`
  font-size: 2.4em;
  overflow-y: auto;
  padding: 0.6em 0.7em 0.5em;
  flex: 1;
  min-height: 0;
`

/* Visual recipe copied (intentionally) from BottomBarNavigation so the
   ExtensionNav and the standard help-dialog bottom bar feel like
   siblings. Keep them in sync if you tweak the look on one side. */
const barCss = (primary: string) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 2.4em;
  padding: 0.3em 1em;
  border-top: 1px solid color-mix(in srgb, ${primary} 8%, transparent);
  background: linear-gradient(to top, color-mix(in srgb, ${primary} 4%, transparent), transparent);
`

const singleSlideBarCss = css`
  /* Single-slide variant: just a centered Close button, no Previous/Next
     to surround. justify-content: center collapses the bar around it. */
  justify-content: center;
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
