import { Interpolation, Theme } from '@emotion/react'
import { useDraggedItem, useMaterialContext } from '../../../hooks'
import { useStaticLocations } from '../../../hooks/useStaticLocations'

export const StaticLocationsDisplay = (props: { css?: Interpolation<Theme> }) => {
  const context = useMaterialContext()
  const locations = useStaticLocations()
  const draggedItem = useDraggedItem()
  return <>{
    locations.map(({ location, focusRef }) => {
      const description = context.locators[location.type]?.getLocationDescription(location, { ...context, ...draggedItem })
      const LocationComponent = description?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} description={description} ref={focusRef} {...props}/>
    })
  }</>
}