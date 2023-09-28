import { Location } from '@gamepark/rules-api'
import { useItemLocator, useMaterialContext } from '../../../hooks'
import uniqueId from 'lodash/uniqueId'
import { useMemo } from 'react'

export type LocationsMaskProps = {
  locations: Location[]
}

export const LocationsMask = ({ locations }: LocationsMaskProps) => {
  const id = useMemo(() => uniqueId('mask'), [])
  if (!locations.length) return null
  return (
    <svg width="100%" height="100%">
      <defs>
        <mask id={id}>
          <rect width="100%" height="100%" fill="white"/>
          {locations.map(location => <LocationRect key={JSON.stringify(location)} location={location}/>)}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="black" fillOpacity={0.5} mask={`url(#${id})`}/>
    </svg>
  )
}

type LocationRectProps = {
  location: Location
}

const LocationRect = ({ location }: LocationRectProps) => {
  const locator = useItemLocator(location.type)!
  const description = locator.locationDescription!
  const context = useMaterialContext()
  const position = locator.getPositionOnParent(location, context)
  const { width, height } = description.getSize(location, context)
  const radius = description.getBorderRadius(location, context) ?? 0
  const coordinates = description.getCoordinates(location, context)
  const transforms: string[] = ['translate(-50%, -50%)']
  if (coordinates) {
    transforms.push(`translate3d(${coordinates.x}em, ${coordinates.y}em, ${coordinates.z}em)`)
  }
  if (description.getRotation) {
    transforms.push(`rotate(${description.getRotation(location, context)}${description.rotationUnit})`)
  }
  return (
    <rect fill="black" x={`${position.x}%`} y={`${position.y}%`} width={`${width}em`} height={`${height}em`} rx={`${radius}em`} ry={`${radius}em`}
          style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: transforms.join(' ') }}/>
  )
}
