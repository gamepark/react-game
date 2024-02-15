/** @jsxImportSource @emotion/react */
import { Interpolation, Theme } from '@emotion/react'
import equal from 'fast-deep-equal'
import { useMaterialContext } from '../../../hooks'
import { SimpleDropArea } from '../locations'
import { useFocusContext } from './focus'

export const StaticLocationsDisplay = (props: { css?: Interpolation<Theme> }) => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  return <>
    {Object.values(context.locators).map(locator => {
        return locator?.getLocationDescription(context)?.getLocations(context).map(location => {
          const isFocused = focus?.locations.some(focusedLocation => equal(focusedLocation, location))
          return <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={isFocused} ref={isFocused ? addFocusRef : undefined}
                                 {...props}/>
        })
      }
    )}
  </>
}