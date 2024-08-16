/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import { useMaterialContext } from '../../../hooks'
import { useStaticLocations } from '../../../hooks/useStaticLocations'

export const StaticLocationsDisplay = (props: { css?: Interpolation<Theme> }) => {
  const context = useMaterialContext()
  const locations = useStaticLocations()
  return <>{
    locations.map(({ location, focusRef }) => {
      const LocationComponent = context.locators[location.type]?.getLocationDescription(context)?.Component
      if (!LocationComponent) return null
      return <LocationComponent key={JSON.stringify(location)} location={location} ref={focusRef} {...props}/>
    })
  }</>
}