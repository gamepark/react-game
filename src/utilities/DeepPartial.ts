/**
 * Inspired from @apollo/client/utilities/DeepPartial: transform all properties from a type into optional properties, recursively
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T
