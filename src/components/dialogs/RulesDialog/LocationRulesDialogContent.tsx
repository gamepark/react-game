/** @jsxImportSource @emotion/react */
import { closeRulesDisplay, LocationRulesDisplay, MaterialRulesMove } from '@gamepark/rules-api'
import { css } from '@emotion/react'
import Scrollbars from 'react-custom-scrollbars-2'
import { ItemLocator } from '../../../locators'
import { MaterialDescription } from '../../material'
import { usePlay } from '../../../hooks'

export type LocationRulesDialogContentProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  rulesDisplay: LocationRulesDisplay<Player, LocationType>
  material: Record<MaterialType, MaterialDescription>
  locator: ItemLocator<Player, MaterialType, LocationType>
  legalMoves: MaterialRulesMove<Player, MaterialType, LocationType>[]
}

export const LocationRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { rulesDisplay, locator, legalMoves }: LocationRulesDialogContentProps<P, M, L>
) => {
  const play = usePlay()
  return <div css={flex}>
    {/* TODO: image of the location? */}
    <Scrollbars autoHeight css={scrollableContainer}>
      <div css={rules}>
        {locator.getLocationRules && locator.getLocationRules({
          location: rulesDisplay.location,
          legalMoves,
          close: () => play(closeRulesDisplay, { local: true })
        })}
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

const rules = css`
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
