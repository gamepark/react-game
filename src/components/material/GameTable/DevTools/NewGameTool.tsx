/** @jsxImportSource @emotion/react */
import { availableValues, legalPlayerCounts, listOptions, optionValueKey, OptionValue } from '@gamepark/rules-api'
import { FC, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { gameContext } from '../../../GameProvider/GameContext'
import { GameOption } from './DevToolsHub'
import {
  checkboxCss, goBtnCss, inlineRowCss, numberInputCss, optionsToggleCss, selectCss,
  stepBtnCss, toggleLabelCss, toggleRowCss, toolBtnCss, toolDescCss, toolIconCss, toolLabelCss
} from './devtools.css'

type NewGameToolProps = {
  exec: (action: () => void, msg: string) => void
  g: any
  gameOptions?: GameOption[]
}

/** What a player may be asked to be. Both are addressed as `players[i].<field>` by the local game API. */
const concepts = ['identities', 'teams'] as const
type Concept = typeof concepts[number]
const conceptField: Record<Concept, 'id' | 'team'> = { identities: 'id', teams: 'team' }

export const NewGameTool: FC<NewGameToolProps> = ({ exec, g, gameOptions }) => {
  const [players, setPlayers] = useState(2)
  const [options, setOptions] = useState<Record<string, any>>({})
  const [seats, setSeats] = useState<Record<string, any>[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const optionsSpec = useContext(gameContext).optionsSpec
  // A v2 spec carries no text: the labels come from the game's own options document, served beside its
  // translations. Never suspend on it — a devtool must open even when that file is missing.
  const { t } = useTranslation('options', { useSuspense: false })

  const label = (key: string, fallback: string) => t(key, { defaultValue: fallback })

  /** Table sizes the spec allows — with teams that is not a range, it is 2, 4, 6. */
  const counts = useMemo<number[]>(() => {
    if (!optionsSpec) return Array.from({ length: 10 }, (_, index) => index + 1)
    const legal = legalPlayerCounts(optionsSpec)
    return legal.length ? legal : [optionsSpec.players.min]
  }, [optionsSpec])

  const specOptions = useMemo(() => (optionsSpec ? listOptions(optionsSpec) : []), [optionsSpec])

  /** Only the concepts the spec declares, with the values still available at this table size. */
  const seatChoices = useMemo(() => {
    if (!optionsSpec) return []
    return concepts
      .filter((concept) => optionsSpec[concept])
      .map((concept) => ({
        concept,
        field: conceptField[concept],
        values: (optionsSpec[concept]!.values as any[]).map((value) => (typeof value === 'object' ? value.value : value)) as OptionValue[]
      }))
  }, [optionsSpec])

  const setPlayerCount = (count: number) => {
    setPlayers(count)
    setSeats((previous) => (previous.length > count ? previous.slice(0, count) : previous))
  }

  const step = (direction: 1 | -1) => {
    const index = counts.indexOf(players)
    const next = counts[Math.min(counts.length - 1, Math.max(0, (index < 0 ? 0 : index) + direction))]
    if (next !== undefined) setPlayerCount(next)
  }

  const setSeat = (index: number, field: string, value: any) => {
    setSeats((previous) => {
      const next = [...previous]
      while (next.length <= index) next.push({})
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const parse = (raw: string): OptionValue | undefined => (raw === '' ? undefined : isNaN(Number(raw)) ? raw : Number(raw))

  /**
   * What is handed to `game.new`.
   *
   * Only what was actually chosen: everything omitted is resolved by the spec, so leaving the panel
   * untouched still starts a real game rather than an empty one.
   */
  const buildOptions = () => {
    const chosen = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined && value !== false))
    const wishes = seats.some((seat) => Object.values(seat ?? {}).some((value) => value !== undefined))
    if (!Object.keys(chosen).length && !wishes) return players
    return { ...chosen, players: wishes ? Array.from({ length: players }, (_, index) => seats[index] ?? {}) : players }
  }

  const hasPanel = specOptions.length > 0 || seatChoices.length > 0 || !!gameOptions?.length

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}>{'↻'}</span>
      <span css={toolLabelCss}>New Game</span>
      <span css={toolDescCss}>Reset with N players</span>
      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
        <button css={stepBtnCss} onClick={() => step(-1)}>-</button>
        <input type="number" min={counts[0]} max={counts[counts.length - 1]} value={players}
          onChange={e => setPlayerCount(parseInt(e.target.value) || counts[0])}
          css={numberInputCss} />
        <button css={stepBtnCss} onClick={() => step(1)}>+</button>
        <button css={goBtnCss}
          onClick={() => exec(() => g.new(buildOptions()), `New game ${players}p`)}>
          Go
        </button>
      </div>
      {hasPanel && (
        <button css={optionsToggleCss} onClick={e => { e.stopPropagation(); setShowOptions(o => !o) }}>
          <span>{showOptions ? '▾' : '▸'}</span>
          <span>Options</span>
        </button>
      )}
      {showOptions && <>
        {specOptions.map(({ key, option }) => {
          const name = label(`option.${key}`, key)
          if (option.kind === 'boolean') {
            return (
              <label key={key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={options[key] ?? false}
                  onChange={e => setOptions(prev => ({ ...prev, [key]: e.target.checked }))} css={checkboxCss} />
                <span css={toggleLabelCss}>{name}</span>
              </label>
            )
          }
          const values = availableValues(option, players, {})
          if (option.kind === 'enum-set') {
            // A set is several values at once, so it is a row of checkboxes. The local API reads the
            // array as "these are in" and draws the rest.
            const picked: OptionValue[] = options[key] ?? []
            return (
              <div key={key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
                <span css={toggleLabelCss}>{name}</span>
                {values.map(value => (
                  <label key={optionValueKey(value)} css={toggleLabelCss}>
                    <input type="checkbox" checked={picked.includes(value)} css={checkboxCss}
                      onChange={e => setOptions(prev => ({
                        ...prev,
                        [key]: e.target.checked ? [...picked, value] : picked.filter(entry => entry !== value)
                      }))} />
                    {label(`option.${key}.${optionValueKey(value)}`, optionValueKey(value))}
                  </label>
                ))}
              </div>
            )
          }
          return (
            <div key={key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
              <span css={toggleLabelCss}>{name}</span>
              <select value={options[key] ?? ''} css={selectCss}
                onChange={e => setOptions(prev => ({ ...prev, [key]: parse(e.target.value) }))}>
                <option value="">—</option>
                {values.map(value => (
                  <option key={optionValueKey(value)} value={String(value)}>
                    {label(`option.${key}.${optionValueKey(value)}`, optionValueKey(value))}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
        {seatChoices.length > 0 && Array.from({ length: players }, (_, index) => (
          seatChoices.map(({ concept, field, values }) => (
            <div key={`${index}-${field}`} css={toggleRowCss} onClick={e => e.stopPropagation()}>
              <span css={toggleLabelCss}>P{index + 1} {label(concept, concept)}</span>
              <select value={seats[index]?.[field] ?? ''} css={selectCss}
                onChange={e => setSeat(index, field, parse(e.target.value))}>
                <option value="">—</option>
                {values.map(value => (
                  <option key={optionValueKey(value)} value={String(value)}>
                    {label(`${concept}.${optionValueKey(value)}`, optionValueKey(value))}
                  </option>
                ))}
              </select>
            </div>
          ))
        ))}
        {gameOptions?.map(opt => (
          <label key={opt.key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={options[opt.key] ?? false}
              onChange={e => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))} css={checkboxCss} />
            <span css={toggleLabelCss}>{opt.label}</span>
          </label>
        ))}
      </>}
    </div>
  )
}
