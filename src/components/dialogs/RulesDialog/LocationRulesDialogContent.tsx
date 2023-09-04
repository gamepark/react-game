/** @jsxImportSource @emotion/react */
import { closeRulesDisplay, LocationRulesDisplay } from '@gamepark/rules-api'
import { css } from '@emotion/react'
import Scrollbars from 'react-custom-scrollbars-2'
import { useItemLocator, useMaterialContext, usePlay } from '../../../hooks'
import { fontSizeCss } from '../../../css'

export type LocationRulesDialogContentProps<P extends number = number, L extends number = number> = {
  rulesDisplay: LocationRulesDisplay<P, L>
}

export const LocationRulesDialogContent = <P extends number = number, L extends number = number>(
  { rulesDisplay }: LocationRulesDialogContentProps<P, L>
) => {
  const play = usePlay()
  const context = useMaterialContext()
  const locator = useItemLocator(rulesDisplay.location.type)
  const description = locator?.locationDescription
  if (!description?.rules) return null
  const image = description.getRulesImage(rulesDisplay.location, context)
  const { width, height } = description.getSize(rulesDisplay.location, context)
  return <div css={flex}>
    {!!image &&
      <div css={[noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)), backgroundImage(image, height, width)]}/>
    }
    <Scrollbars autoHeight css={scrollableContainer}>
      <div css={rulesCss}>
        <description.rules location={rulesDisplay.location} closeDialog={() => play(closeRulesDisplay, { local: true })}/>
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

const backgroundImage = (image: string, height: number, width: number) => css`
  background-image: url(${image});
  background-size: cover;
  height: ${height}em;
  width: ${width}em;
`

const scrollableContainer = css`
  max-height: calc(90vh - 6em) !important;

  > div {
    max-height: calc(90vh - 6em) !important;

    // trick to avoid very thin bar on some resolutions with react-custom-scrollbars-2
    scrollbar-width: none;
    -ms-overflow-style: none;

    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
`
