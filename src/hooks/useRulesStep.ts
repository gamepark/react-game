import { MaterialRules, MaterialRulesPart } from '@gamepark/rules-api'
import { useRules } from './useRules'

export function useRulesStep<T extends MaterialRulesPart>(): T | undefined {
  const rules = useRules<MaterialRules>()
  return rules?.rulesStep as T | undefined
}
