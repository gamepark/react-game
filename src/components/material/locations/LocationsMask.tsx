import { Location } from '@gamepark/rules-api'
import uniqueId from 'lodash/uniqueId'
import { useMemo } from 'react'
import { useItemLocator, useMaterialContext } from '../../../hooks'

export type LocationsMaskProps = {
  locations: Location[]
}

export const LocationsMask = ({ locations }: LocationsMaskProps) => {
  const id = useMemo(() => uniqueId('mask'), [])
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute' }}>
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
  const context = useMaterialContext()
  const description = locator.getLocationDescription(context)!
  const position = locator.getPositionOnParent(location, context)
  const { width, height } = description.getLocationSize(location, context)
  const radius = description.getBorderRadius(location.id) ?? 0
  const transforms: string[] = description.transformLocation(location, context)
  return (
    <rect fill="black" x={`${position.x}%`} y={`${position.y}%`} width={`${width}em`} height={`${height}em`} rx={`${radius}em`} ry={`${radius}em`}
          style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: transforms.join(' ') }}/>
  )
}
