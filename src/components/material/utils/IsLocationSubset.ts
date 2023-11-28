import { Location } from '@gamepark/rules-api'
import equal from 'fast-deep-equal'

export const isLocationSubset = (testLocation: Partial<Location>, parentLocation: Location) => {
  return Object.keys(parentLocation).every(key => parentLocation[key] === undefined || equal(parentLocation[key], testLocation[key]))
}
