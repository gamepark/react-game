/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { Location, XYCoordinates } from '@gamepark/rules-api'
import { forwardRef, HTMLAttributes, useMemo } from 'react'
import { backgroundCss, borderRadiusCss, sizeCss, transformCss } from '../../../css'
import { useMaterialContext } from '../../../hooks'

export type LocationDisplayProps<P extends number = number, L extends number = number> = {
  location: Location<P, L>
  canDrop?: boolean
} & HTMLAttributes<HTMLDivElement>

export const LocationDisplay = forwardRef<HTMLDivElement, LocationDisplayProps>((
  { location, canDrop = false, ...props }, ref
) => {
  const context = useMaterialContext()
  const locator = context.locators[location.type]
  const description = locator?.getLocationDescription(context)
  const locationContext = useMemo(() => ({ ...context, canDrop }), [context, canDrop])

  if (!description) { // TODO: parent should never include a simple drop area which description is missing at all
    console.warn('You must provide a LocationDescription to create drop locations with an ItemLocator')
    return null
  }

  const { width, height } = description.getLocationSize(location, context)
  const image = description.getImage(location, context)
  const borderRadius = description.getBorderRadius(location.id)
  const positionOnParent = useMemo(() => locator?.parentItemType !== undefined ? locator.getPositionOnParent(location, context) : undefined, [location, context, location])

  return (
    <div ref={ref}
         css={[
           absolute,
           positionOnParent && positionOnParentCss(positionOnParent),
           transformCss(...description.transformLocation(location, locationContext)),
           sizeCss(width, height), image && backgroundCss(image), borderRadius && borderRadiusCss(borderRadius),
           description.getExtraCss(location, locationContext)
         ]}
         {...props}>
      {description.content && <description.content location={location}/>}
    </div>
  )
})

LocationDisplay.displayName = 'LocationDisplay'

const absolute = css`
  position: absolute;
`

const positionOnParentCss = ({ x, y }: XYCoordinates) => css`
  left: ${x}%;
  top: ${y}%;
`
