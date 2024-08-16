/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import isEqual from 'lodash/isEqual'
import { useMaterialContext } from '../../../hooks'
import { getStaticLocationsWithFocus, useFocusContext } from './focus'

export const StaticLocationsDisplay = (props: { css?: Interpolation<Theme> }) => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  const locations = getStaticLocationsWithFocus(context, focus)
  return (
    <>
      {
        locations.map(location => {
          const LocationComponent = context.locators[location.type]?.getLocationDescription(context)?.Component
          if (!LocationComponent) return null
          const isFocused = focus?.locations.some(focusedLocation => isEqual(focusedLocation, location))
          return (
            <LocationComponent
              key={JSON.stringify(location)}
              location={location}
              ref={isFocused ? addFocusRef : undefined}
              {...props}/>
          )
        })
      }
    </>
  )
}