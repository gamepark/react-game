/** @jsxImportSource @emotion/react */
import { closeRulesDisplay, LocationRulesDisplay } from '@gamepark/rules-api'
import { css } from '@emotion/react'
import Scrollbars from 'react-custom-scrollbars-2'
import { useItemLocator, usePlay } from '../../../hooks'

export type LocationRulesDialogContentProps<P extends number = number, L extends number = number> = {
  rulesDisplay: LocationRulesDisplay<P, L>
}

export const LocationRulesDialogContent = <P extends number = number, L extends number = number>(
  { rulesDisplay }: LocationRulesDialogContentProps<P, L>
) => {
  const play = usePlay()
  const locator = useItemLocator(rulesDisplay.location.type)
  if (!locator?.locationDescription?.rules) return null
  return <div css={flex}>
    {/* TODO: image of the location? */}
    <Scrollbars autoHeight css={scrollableContainer}>
      <div css={rulesCss}>
        <locator.locationDescription.rules location={rulesDisplay.location} closeDialog={() => play(closeRulesDisplay, { local: true })}/>
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

const rulesCss = css`
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
