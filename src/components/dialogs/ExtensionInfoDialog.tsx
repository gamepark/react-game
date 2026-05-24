import { css, useTheme } from '@emotion/react'
import { FC, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomBarNavigation } from './RulesDialog/BottomBarNavigation'
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
 *   - the carousel navigation (uses `theme.dialog.navigation` — same component that drives
 *     paging in the help dialogs, so the look stays consistent game-wide)
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
  const { t } = useTranslation()
  const [open, setOpen] = useState<boolean>(() => popups.length > 0 && !isDismissed(storageKey))
  const [index, setIndex] = useState(0)

  const total = popups.length
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, total - 1))

  const close = useCallback(() => {
    markDismissed(storageKey)
    setOpen(false)
  }, [storageKey])

  const onPrevious = safeIndex > 0 ? () => setIndex(i => i - 1) : undefined
  // On the last slide, Next doubles as a "close" affordance with a
  // "Close" label override. The user has paged through every
  // announcement, so the natural follow-up is to dismiss the popup —
  // mirrors classic onboarding carousels where the final "Next"
  // button reads as "Got it / Done".
  //
  // Behaviour is scoped to this dialog only: BottomBarNavigation just
  // exposes a `nextLabel` slot. Help/rules dialogs that ALSO use
  // BottomBarNavigation never pass nextLabel and never wire close into
  // onNext, so their last page keeps the disabled "Next" button.
  const isLast = safeIndex === total - 1
  const onNext = isLast ? close : () => setIndex(i => i + 1)
  const nextLabel = isLast ? t('Close', { ns: 'common' }) : undefined

  if (total === 0) return null

  // Game-provided navigation if any, else fall back to the framework's default bottom bar.
  const Navigation = theme.dialog.navigation ?? BottomBarNavigation

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
        {total > 1 && (
          <Navigation onPrevious={onPrevious} onNext={onNext} currentIndex={safeIndex} total={total} nextLabel={nextLabel}/>
        )}
      </div>
    </RulesDialog>
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
   reads at the same scale as the rest of the rules UI, and BottomBarNavigation (its own
   2.4em) lands at the expected size right below. */
const contentCss = css`
  font-size: 2.4em;
  overflow-y: auto;
  padding: 0.6em 0.7em 0.5em;
  flex: 1;
  min-height: 0;
`
