import { MaterialMove, MaterialRules } from '@gamepark/rules-api'
import { ReactElement } from 'react'
import { Trans } from 'react-i18next'
import { useLegalMoves, usePlayerId, usePlayerName, useRules } from '../../hooks'
import { PlayMoveButton } from '../buttons'

type Props = {
  code: string
  values?: Record<string, any>
  components?: Record<string, ReactElement>
  moves?: Record<string, (move: MaterialMove) => boolean>
}

export const HeaderText = ({ code, values = {}, components = {}, moves = {} }: Props) => {
  const rules = useRules<MaterialRules>()!
  const me = usePlayerId()
  const activePlayers = rules.activePlayers
  const player = usePlayerName(activePlayers[0])
  const legalMoves = useLegalMoves()
  if (me !== undefined && activePlayers.includes(me)) {
    for (const key in moves) {
      components[key] = <PlayMoveButton move={legalMoves.find(moves[key])}/>
    }
    return <Trans defaults={`header.${code}.you`} values={values} components={components}/>
  } else if (activePlayers.length === 1) {
    return <Trans defaults={`header.${code}.player`} values={{ ...values, player }} components={components}/>
  } else {
    return <Trans defaults={`header.${code}.players`} values={values} components={components}/>
  }
}
