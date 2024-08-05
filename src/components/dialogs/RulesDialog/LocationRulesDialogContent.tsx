/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { LocationHelpDisplay } from '@gamepark/rules-api'
import { fontSizeCss } from '../../../css'
import { useItemLocator, useMaterialContext } from '../../../hooks'
import { useCloseHelpDialog } from '../../../hooks/useCloseHelpDialog'
import { helpDialogContentCss } from './RulesHelpDialogContent'

export type LocationRulesDialogContentProps<P extends number = number, L extends number = number> = {
  helpDisplay: LocationHelpDisplay<P, L>
}

export const LocationRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { helpDisplay }: LocationRulesDialogContentProps<P, L>
) => {
  const closeHelpDialog = useCloseHelpDialog()
  const context = useMaterialContext<P, M, L>()
  const locator = useItemLocator<P, M, L>(helpDisplay.location.type)
  const description = locator?.getLocationDescription(context)
  if (!description?.help) return null
  const image = description.getHelpImage(helpDisplay.location, context)
  const { width, height } = description.getLocationSize(helpDisplay.location, context)
  return <div css={flex}>
    {!!image &&
      <div css={[noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)), backgroundImage(image, height, width)]}/>
    }
    <div css={helpDialogContentCss}>
      <description.help location={helpDisplay.location} closeDialog={closeHelpDialog}/>
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
