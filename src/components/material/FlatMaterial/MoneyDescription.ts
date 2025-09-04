import { isSameLocationArea, MaterialItem } from '@gamepark/rules-api'
import { sumBy } from 'es-toolkit'
import { TFunction } from 'i18next'
import { ItemContext } from '../../../locators'
import { FlatMaterialDescription } from './FlatMaterial'

export abstract class MoneyDescription<P extends number = number, M extends number = number, L extends number = number, ItemId = any>
  extends FlatMaterialDescription<P, M, L, ItemId> {

  getTooltip(item: MaterialItem<P, L>, t: TFunction, context: ItemContext<P, M, L>): string | null | undefined {
    const { rules, type } = context
    const material = rules.material(type).location(l => isSameLocationArea(l, item.location))
    const amount = sumBy(material.getItems(), item => (item.id ?? 1) * (item.quantity ?? 1))
    return t('quantity.tooltip', { n: amount })
  }
}
