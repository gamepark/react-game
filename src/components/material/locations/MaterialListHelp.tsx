/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { Location, MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
import { ReactNode, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { pointerCursorCss } from '../../../css'
import { usePlay, useRules } from '../../../hooks'
import { MaterialComponent } from '../MaterialComponent'

import displayMaterialHelp = MaterialMoveBuilder.displayMaterialHelp

export type MaterialListHelpProps<M extends number = number, L extends number = number> = {
  /** The location whose contents are being listed. */
  location: Location<any, L>
  /** Material type of the items rendered in the list. */
  type: M
  /** i18n key for the dialog title (rendered in an `<h2>`). */
  titleKey?: string
  /** i18n key for the count line (rendered in a `<p>`). Receives `{ number }`. */
  countKey?: string
  /** Optional extra paragraph(s) rendered between the count and the grid. */
  description?: ReactNode
  /**
   * Comparator deciding card order. Defaults to "most recent first" by
   * sorting on `-location.x` (matches the standard discard convention where
   * `x` is the insertion order).
   */
  sortBy?: (item: MaterialItem<any, L, any>) => number
  /** Max cards per row before wrapping. Defaults to 5. */
  maxCols?: number
  /** Optional callback when a card is clicked (defaults to opening its help). */
  onCardClick?: (item: MaterialItem<any, L, any>, index: number) => void
}

/**
 * Generic help dialog content listing every card in a given location.
 *
 * Clicking a card opens that card's own help dialog (stacked on top of this
 * one — the dialog navigation lets the player come back).
 *
 * Designed to be plugged into a `LocationDescription.help`:
 *
 * ```tsx
 * class DiscardArea extends DropAreaDescription {
 *   redirectsItemHelp = true                            // recommended pairing
 *   help = ({ location }: LocationHelpProps) =>
 *     <MaterialListHelp type={MaterialType.Card} location={location}
 *                       titleKey="help.discard.title"
 *                       countKey="help.discard.count"/>
 * }
 * ```
 */
export const MaterialListHelp = <M extends number = number, L extends number = number>(
  {
    location,
    type,
    titleKey,
    countKey,
    description,
    sortBy = (item) => -(item.location.x ?? 0),
    maxCols = 5,
    onCardClick
  }: MaterialListHelpProps<M, L>
) => {
  const { t } = useTranslation()
  const play = usePlay()
  const rules = useRules<any>()
  const cards = useMemo(() => {
    if (!rules) return undefined
    return rules.material(type).location(location.type).locationId(location.id).sort(sortBy)
  }, [rules, type, location.type, location.id, sortBy])

  const count = cards?.length ?? 0

  return <>
    {titleKey && <h2>{t(titleKey, { ...location })}</h2>}
    {countKey && <p><Trans i18nKey={countKey} values={{ number: count, ...location }}/></p>}
    {description}
    {cards && count > 0 && (
      <ol css={[gridCss, gridMaxWidthCss(maxCols)]}>
        {cards.entries.map(([index, card]: [number, MaterialItem<any, L, any>]) => (
          <li key={index}>
            <MaterialComponent
              type={type}
              itemId={card.id}
              css={pointerCursorCss}
              onClick={onCardClick
                ? () => onCardClick(card, index)
                : () => play(displayMaterialHelp(type, card, index), { local: true })}
            />
          </li>
        ))}
      </ol>
    )}
  </>
}

// Cap the grid at `maxCols` cards per row, but never force the popup to grow:
// `max-width: calc(...)` clamps the natural content size, while flex-wrap
// gracefully handles narrower dialogs.
const gridMaxWidthCss = (maxCols: number) => css`
  max-width: calc(${maxCols} * 7em + ${maxCols - 1} * 0.6em);
`

// Padding-top/bottom leaves room for the hover translateY without the dialog's
// internal overflow:auto clipping the lifted card.
const gridCss = css`
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  gap: 0.6em;
  padding: 0.3em 0 0.5em;
  margin: 0.5em 0 0;
  font-size: 1.2em;

  li {
    display: flex;
    transition: transform 0.18s cubic-bezier(.3, 1.4, .4, 1);
  }
  li:hover {
    transform: translateY(-0.25em);
    z-index: 1;
  }
`
