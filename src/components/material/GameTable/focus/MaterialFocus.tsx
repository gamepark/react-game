import { Location, Material, MaterialItem } from '@gamepark/rules-api'

export type MaterialFocus<P extends number = number, M extends number = number, L extends number = number> = {
  materials: Material<P, M, L>[]
  staticItems: StaticItem<P, M, L>[] | Partial<Record<M, MaterialItem<P, L>[]>>
  locations: Location<P, L>[]
  margin?: Margin
  scale?: number
  highlight?: true
  animationTime?: number
}

export type Margin = {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export type StaticItem<P extends number = number, M extends number = number, L extends number = number> = {
  type: M
  item: MaterialItem<P, L>
}
