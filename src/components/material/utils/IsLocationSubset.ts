import { Location } from '@gamepark/rules-api'
import { isEqual } from 'es-toolkit'

export const isLocationSubset = (testLocation: Location, parentLocation: Location) => {
  let key: keyof Location
  for (key in parentLocation) {
    if (parentLocation[key] !== undefined && !isEqual(parentLocation[key], testLocation[key])) {
      return false
    }
  }
  return true
}
