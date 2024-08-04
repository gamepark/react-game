/**
 * Base class for components displayed on the game table by the framework.
 * Contains all features common to items and locations display.
 */
export abstract class ComponentDescription {
  /**
   * All the images that can be used to display the item, and therefore should be preloaded with the web page.
   */
  abstract getImages(): string[]
}

/**
 * Size of a component on the game table, in centimeters
 */
export type ComponentSize = {
  width: number
  height: number
}