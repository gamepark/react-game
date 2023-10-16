/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { closeRulesDisplay, LocationRulesDisplay } from '@gamepark/rules-api'
import { fontSizeCss } from '../../../css'
import { useItemLocator, useMaterialContext, usePlay } from '../../../hooks'

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
    <div css={rulesCss}>
      <description.rules location={rulesDisplay.location} closeDialog={() => play(closeRulesDisplay, { local: true })}/>
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

const rulesCss = css`
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

const backgroundImage = (image: string, height: number, width: number) => css`
  background-image: url(${image});
  background-size: cover;
  height: ${height}em;
  width: ${width}em;
`
