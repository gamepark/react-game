/** @jsxImportSource @emotion/react */
import { useMaterialContext } from '../../../hooks'
import { SimpleDropArea } from '../locations'
import { FocusableElement, isLocationFocus } from './FocusableElement'

type StaticLocationsDisplayProps = {
  tutorialFocus?: FocusableElement | FocusableElement[]
  addFocusRef: (ref: HTMLElement | null) => void
}
export const StaticLocationsDisplay = ({ tutorialFocus, addFocusRef }: StaticLocationsDisplayProps) => {
  const context = useMaterialContext()
  return <>
    {Object.values(context.locators).map(locator => {
        return locator?.getLocationDescription(context)?.getLocations(context).map(location => {
          const isFocus = isLocationFocus(location, tutorialFocus)
          return <SimpleDropArea key={JSON.stringify(location)} location={location} alwaysVisible={isFocus} ref={isFocus ? addFocusRef : undefined}/>
        })
      }
    )}
  </>
}