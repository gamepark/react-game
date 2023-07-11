/** @jsxImportSource @emotion/react */
import { closeRulesDisplay, MaterialRulesDisplay } from '@gamepark/rules-api'
import { css } from '@emotion/react'
import Scrollbars from 'react-custom-scrollbars-2'
import { isFlatMaterialDescription, MaterialComponent } from '../../material'
import { fontSizeCss, transformCss } from '../../../css'
import { useMaterialDescription, usePlay } from '../../../hooks'

export type MaterialRulesDialogContentProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  rulesDisplay: MaterialRulesDisplay<Player, MaterialType, LocationType>
}

export const MaterialRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { rulesDisplay }: MaterialRulesDialogContentProps<P, M, L>
) => {
  const play = usePlay()
  const description = useMaterialDescription(rulesDisplay.itemType)
  if (!description) return null
  const item = rulesDisplay.item
  const { width, height } = description.getSize(item.id)
  return <div css={flex}>
    <MaterialComponent type={rulesDisplay.itemType} itemId={item.id} css={[
      noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)),
      isFlatMaterialDescription(description) && description.isHidden(item) && transformCss('rotateY(180deg)')
    ]}/>
    <Scrollbars autoHeight css={scrollableContainer}>
      <div css={rulesStyle}>
        <description.rules {...rulesDisplay} closeDialog={() => play(closeRulesDisplay, { local: true })}/>
      </div>
    </Scrollbars>
  </div>
}

const flex = css`
  display: flex;
  padding: 3em 1em 3em 3em;
  max-width: 90vw;
  max-height: 90vh;
`

const noShrink = css`
  flex-shrink: 0;
`

const rulesStyle = css`
  margin: 0 1em;
  font-size: 3em;

  > h2 {
    margin: 0 1em;
    text-align: center;
  }

  > p {
    white-space: break-spaces;
  }
`

const scrollableContainer = css`
  max-height: calc(90vh - 6em) !important;

  > div {
    max-height: calc(90vh - 6em + 17px) !important;

    // trick to avoid very thin bar on some resolutions with react-custom-scrollbars-2
    scrollbar-width: none;
    -ms-overflow-style: none;

    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
`
