/** @jsxImportSource @emotion/react */
import { css, keyframes, ThemeProvider } from '@emotion/react'
import { FC, HTMLAttributes, useEffect, useState } from 'react'
import { linkButtonCss } from '../../css'
import { useHistory } from '../../hooks/useHistory'

type HistoryProps = {
  gameId?: string
} & HTMLAttributes<HTMLDivElement>

type PreviewEntry = {
  type: 'message' | 'history'
  id: string
  action: any
  status?: 'active' | 'inactive'
}

export const JournalPreview: FC<HistoryProps> = (props) => {
  const { gameId, ...rest } = props
  const { histories } = useHistory()
  const [lastHistoryId, setLastHistoryId] = useState<string | undefined>(undefined)
  const addEntry = (message: PreviewEntry) => {
    setEntries((existingEntries) => {
      for (var index = 0; index < message.action.length; index++) {
        const action = message.action[index]
        const entryId = `${message.id}_${index}`
        if (existingEntries.some((entry) => entry.id === entryId)) return existingEntries
        existingEntries.push({
          type: message.type,
          id: entryId,
          action: action,
          status: 'active'
        })
      }
      return existingEntries
    })
  }

  const [entries, setEntries] = useState<PreviewEntry[]>([])

  useEffect(() => {
    const newEntries = !lastHistoryId ? [] : Array.from(histories.entries()).filter((e) => +e[0] > +lastHistoryId)
    newEntries.forEach((e) => {
      addEntry({ type: 'history', id: e[0], action: e[1] })
    })

    const allEntries = Array.from(histories.entries())
    if (allEntries.length) {
      setLastHistoryId(allEntries[allEntries.length - 1][0])
    }

  }, [histories.size])

  //console.log(entries.length)

  return (
    <ThemeProvider theme={theme => ({ ...theme, buttons: historyButtonCss })}>
      <div css={scrollCss} {...rest}>
        <div css={scrollContentCss}>
          {entries.map(({ id, action, status }) => {
            return (
              <div key={id} css={[entryCss, popInCss, status === 'inactive' && popOutCss]}>
                {action}
              </div>
            )
          })
          }
        </div>
      </div>
    </ThemeProvider>
  )
}

const entryCss = css`
    &:not(:empty) {
        margin-bottom: 1em;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 1em;
        color: white;
        overflow: hidden;
    }
`

const popInKF = keyframes`
    from {
        transform: translateX(-100%);
    }
`

const popInCss = css`
    animation: ${popInKF} 1s forwards;
`

const popOutKf = keyframes`
    to {
        transform: translateX(-100%);
    }
`

const popOutCss = css`
    animation: ${popOutKf} 1s forwards;
`

const scrollCss = css`
    overflow-x: hidden;
    overflow-y: scroll;
    background-color: transparent;
    scrollbar-color: rgba(74, 74, 74, 0.3) transparent;
    scrollbar-width: thin;
    margin-top: 0.5em;
    margin-right: 8px;

    &::-webkit-scrollbar {
        width: 6px
    }

    &::-webkit-scrollbar-thumb {
        border-radius: 7px;
        background-color: rgba(74, 74, 74, 0.3);
    }

    align-self: stretch;
    display: flex;
    flex-direction: column;
`

const scrollContentCss = css`
    position: relative;
    padding-bottom: 0.5em;
    font-size: 0.5em;
`

export const historyButtonCss = [linkButtonCss, css`
    color: inherit;
    background-color: transparent;
    font-style: italic;
`]
