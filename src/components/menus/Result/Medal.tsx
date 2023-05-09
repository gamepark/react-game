import { FC, SVGProps } from 'react'
import { MedalGold } from './MedalGold'
import { MedalSilver } from './MedalSilver'
import { MedalBronze } from './MedalBronze'

const Medal: FC<SVGProps<SVGSVGElement> & { rank: number }> = ({ rank, ...props }) => {
  switch (rank) {
    case 1:
      return <MedalGold {...props}/>
    case 2:
      return <MedalSilver {...props}/>
    default:
      return <MedalBronze {...props}/>
  }
}

export default Medal