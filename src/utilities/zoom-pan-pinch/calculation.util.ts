/**
 * Comes from https://github.com/BetterTyped/react-zoom-pan-pinch/blob/master/src/utils/calculations.utils.ts
 * (mirrors v4.0.4 — re-check on every major upgrade, nothing here fails to compile when it diverges)
 */

/**
 * Rounds number to given decimal
 * eg. roundNumber(2.34343, 1) => 2.3
 */
export const roundNumber = (num: number, decimal: number) => {
  return Number(num.toFixed(decimal))
}
