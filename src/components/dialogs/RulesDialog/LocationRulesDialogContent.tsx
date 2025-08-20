/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { LocationHelpDisplay, MaterialMoveBuilder } from '@gamepark/rules-api'
import { fontSizeCss } from '../../../css'
import { useItemLocator, useMaterialContext, usePlay } from '../../../hooks'
import { helpDialogContentCss } from './RulesHelpDialogContent'
import displayHelp = MaterialMoveBuilder.displayHelp

export type LocationRulesDialogContentProps<P extends number = number, L extends number = number> = {
  helpDisplay: LocationHelpDisplay<P, L>
}

export const LocationRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { helpDisplay: { location } }: LocationRulesDialogContentProps<P, L>
) => {
  const play = usePlay()
  const context = useMaterialContext<P, M, L>()
  const locator = useItemLocator<P, M, L>(location.type)
  const description = locator?.getLocationDescription(location, context)
  const Help = description?.help ?? locator?.help
  if (!Help) return null
  const image = description?.getHelpImage(location, context)
  const { width, height } = description?.getLocationSize(location, context) ?? { width: 0, height: 0 }
  return <div css={flex}>
    {!!image &&
      <div css={[noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)), backgroundImage(image, height, width)]}/>
    }
    <div css={helpDialogContentCss}>
      <Help location={location} closeDialog={() => play(displayHelp(undefined), { transient: true })}/>
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

const backgroundImage = (image: string, height: number, width: number) => css`
  background-image: url(${image});
  background-size: cover;
  height: ${height}em;
  width: ${width}em;
`
