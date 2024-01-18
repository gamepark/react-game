/** @jsxImportSource @emotion/react */
import { useMaterialContext } from '../../../hooks'
import { SimpleDropArea } from '../locations'
import { isLocationFocus, useFocusContext } from './focus'

export const StaticLocationsDisplay = () => {
  const context = useMaterialContext()
  const { focus, addFocusRef } = useFocusContext()
  return <>
    {Object.values(context.locators).map(locator => {
        return locator?.getLocationDescription(context)?.getLocations(context).map(location => {
          const isFocused = isLocationFocus(location, focus)
          return <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={isFocused} ref={isFocused ? addFocusRef : undefined}/>
        })
      }
    )}
  </>
}