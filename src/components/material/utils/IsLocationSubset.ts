import { Location } from '@gamepark/rules-api'
import isEqual from 'lodash/isEqual'

export const isLocationSubset = (testLocation: Partial<Location>, parentLocation: Location) => {
  return Object.keys(parentLocation).every(key => parentLocation[key] === undefined || isEqual(parentLocation[key], testLocation[key]))
}
