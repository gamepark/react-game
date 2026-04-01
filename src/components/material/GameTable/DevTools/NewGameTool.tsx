/** @jsxImportSource @emotion/react */
import { isEnumOption, isWithPlayerOptions, Option, PlayerEnumOption } from '@gamepark/rules-api'
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

const reservedKeys = new Set(['players', 'validate', 'subscriberRequired', 'competitivePlayers'])
const playerReservedKeys = new Set(['id'])

export const NewGameTool: FC<NewGameToolProps> = ({ exec, g, gameOptions }) => {
  const [newGamePlayers, setNewGamePlayers] = useState(2)
  const [options, setOptions] = useState<Record<string, any>>({})
  const [playerOptions, setPlayerOptions] = useState<Record<string, any>[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const optionsSpec = useContext(gameContext).optionsSpec
  const { t } = useTranslation()

  const specOptions = useMemo(() => {
    if (!optionsSpec) return []
    return Object.keys(optionsSpec)
      .filter(key => !reservedKeys.has(key))
      .map(key => ({ key, spec: optionsSpec[key] as Option }))
      .filter(({ spec }) => spec && typeof spec.label === 'function')
  }, [optionsSpec])

  const playerSpecOptions = useMemo(() => {
    if (!optionsSpec || !isWithPlayerOptions(optionsSpec)) return []
    const playersSpec = optionsSpec.players as Record<string, PlayerEnumOption>
    return Object.keys(playersSpec)
      .filter(key => !playerReservedKeys.has(key))
      .map(key => ({ key, spec: playersSpec[key] }))
      .filter(({ spec }) => spec && typeof spec.label === 'function' && Array.isArray(spec.values))
  }, [optionsSpec])

  const setPlayerCount = (count: number) => {
    setNewGamePlayers(count)
    setPlayerOptions(prev => prev.length > count ? prev.slice(0, count) : prev)
  }

  const setPlayerOption = (playerIndex: number, key: string, value: any) => {
    setPlayerOptions(prev => {
      const next = [...prev]
      while (next.length <= playerIndex) next.push({})
      next[playerIndex] = { ...next[playerIndex], [key]: value }
      return next
    })
  }

  const buildOptions = () => {
    const definedOptions = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined && v !== false))
    const hasPlayerOpts = playerOptions.some(p => Object.values(p).some(v => v !== undefined))
    const hasOptions = Object.keys(definedOptions).length > 0 || hasPlayerOpts
    if (!hasOptions) return newGamePlayers
    const result: Record<string, any> = { ...definedOptions }
    if (hasPlayerOpts) {
      result.players = Array.from({ length: newGamePlayers }, (_, i) => playerOptions[i] ?? {})
    } else {
      result.players = newGamePlayers
    }
    return result
  }

  return (
    <div css={toolBtnCss}>
      <span css={toolIconCss}>{'\u21BB'}</span>
      <span css={toolLabelCss}>New Game</span>
      <span css={toolDescCss}>Reset with N players</span>
      <div css={inlineRowCss} onClick={e => e.stopPropagation()}>
        <button css={stepBtnCss} onClick={() => setPlayerCount(Math.max(1, newGamePlayers - 1))}>-</button>
        <input type="number" min={1} max={10} value={newGamePlayers}
          onChange={e => setPlayerCount(Math.max(1, parseInt(e.target.value) || 2))}
          css={numberInputCss} />
        <button css={stepBtnCss} onClick={() => setPlayerCount(Math.min(10, newGamePlayers + 1))}>+</button>
        <button css={goBtnCss}
          onClick={() => exec(() => g.new(buildOptions()), `New game ${newGamePlayers}p`)}>
          Go
        </button>
      </div>
      {(specOptions.length > 0 || playerSpecOptions.length > 0 || gameOptions?.length) && (
        <button css={optionsToggleCss} onClick={e => { e.stopPropagation(); setShowOptions(o => !o) }}>
          <span>{showOptions ? '\u25BE' : '\u25B8'}</span>
          <span>Options</span>
        </button>
      )}
      {showOptions && <>
        {specOptions.map(({ key, spec }) => (
          isEnumOption(spec) ? (
            <div key={key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
              <span css={toggleLabelCss}>{spec.label(t)}</span>
              <select
                value={options[key] ?? ''}
                onChange={e => setOptions(prev => ({ ...prev, [key]: e.target.value === '' ? undefined : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) }))}
                css={selectCss}
              >
                <option value="">—</option>
                {spec.values.map((v: any) => (
                  <option key={String(v)} value={v}>{spec.valueSpec(v).label(t)}</option>
                ))}
              </select>
            </div>
          ) : (
            <label key={key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={options[key] ?? false}
                onChange={e => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                css={checkboxCss}
              />
              <span css={toggleLabelCss}>{spec.label(t)}</span>
            </label>
          )
        ))}
        {playerSpecOptions.length > 0 && Array.from({ length: newGamePlayers }, (_, i) => (
          playerSpecOptions.map(({ key, spec }) => (
            <div key={`${i}-${key}`} css={toggleRowCss} onClick={e => e.stopPropagation()}>
              <span css={toggleLabelCss}>P{i + 1} {spec.label(t)}</span>
              <select
                value={playerOptions[i]?.[key] ?? ''}
                onChange={e => setPlayerOption(i, key, e.target.value === '' ? undefined : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                css={selectCss}
              >
                <option value="">—</option>
                {spec.values.map((v: any) => (
                  <option key={String(v)} value={v}>{spec.valueSpec(v).label(t)}</option>
                ))}
              </select>
            </div>
          ))
        ))}
        {gameOptions?.map(opt => (
          <label key={opt.key} css={toggleRowCss} onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={options[opt.key] ?? false}
              onChange={e => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
              css={checkboxCss}
            />
            <span css={toggleLabelCss}>{opt.label}</span>
          </label>
        ))}
      </>}
    </div>
  )
}
