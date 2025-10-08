import { GridBoundaries } from '@gamepark/rules-api'
import { useDraggedItem, useMaterialContext } from '../../../hooks'
import { useStaticLocations } from '../../../hooks/useStaticLocations'
import { getLocationOriginCss } from '../../../locators'

export const StaticLocationsDisplay = ({ boundaries }: { boundaries: GridBoundaries }) => {
  const context = useMaterialContext()
  const locations = useStaticLocations()
  const draggedItem = useDraggedItem()
  return <>
    {
      locations.map(({ location, focusRef }) => {
        const locator = context.locators[location.type]
        const description = locator?.getLocationDescription(location, { ...context, ...draggedItem })
        const LocationComponent = description?.Component
        if (!LocationComponent) return null
        return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef}
                                  css={getLocationOriginCss(boundaries, locator?.getLocationOrigin(location, context))}/>
      })
    }
  </>
}