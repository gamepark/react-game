/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { closeRulesDisplay, MaterialRulesDisplay } from '@gamepark/rules-api'
import { fontSizeCss, transformCss } from '../../../css'
import { useMaterialContext, useMaterialDescription, usePlay } from '../../../hooks'
import { isFlatMaterialDescription, MaterialComponent } from '../../material'

export type MaterialRulesDialogContentProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  rulesDisplay: MaterialRulesDisplay<Player, MaterialType, LocationType>
}

export const MaterialRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { rulesDisplay }: MaterialRulesDialogContentProps<P, M, L>
) => {
  const play = usePlay()
  const context = useMaterialContext<P, M, L>()
  const description = useMaterialDescription<P, M, L>(rulesDisplay.itemType)
  if (!description) return null
  const item = rulesDisplay.item
  const { width, height } = description.getSize(item.id, context)
  return <div css={flex}>
    <MaterialComponent type={rulesDisplay.itemType} itemId={item.id} css={[
      noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)),
      isFlatMaterialDescription(description) && description.isFlipped(item, context) && transformCss('rotateY(180deg)')
    ]}/>
    <div css={rulesStyle}>
      <description.rules {...rulesDisplay} closeDialog={() => play(closeRulesDisplay, { local: true })}/>
    </div>
  </div>
}

const flex = css`
  display: flex;
  padding: 3em 1em 3em 3em;
  max-width: inherit;
  max-height: inherit;
`

const noShrink = css`
  flex-shrink: 0;
`

const rulesStyle = css`
  margin: 0 0.5em;
  padding: 0 0.5em;
  font-size: 3em;
  overflow: auto;

  > h2 {
    margin: 0 1em;
    text-align: center;
  }

  > p {
    white-space: break-spaces;
  }
`
