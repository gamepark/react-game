/**
 * Base class for components displayed on the game table by the framework.
 * Contains all features common to items and locations display.
 */
export abstract class ComponentDescription<Id = any> {

  constructor(clone?: Partial<Pick<ComponentDescription, 'height' | 'width' | 'ratio' | 'borderRadius'>>) {
    this.height = clone?.height
    this.width = clone?.width
    this.ratio = clone?.ratio
    this.borderRadius = clone?.borderRadius ?? 0
  }

  /**
   * All the images that can be used to display the component, and therefore should be preloaded with the web page.
   */
  abstract getImages(): string[]

  /**
   * Height of the component.
   */
  height?: number

  /**
   * Width of the component.
   */
  width?: number

  /**
   * Ratio (width/height) of the component.
   */
  ratio?: number

  /**
   * Returns the size of component. Default will be process from {@link width}, {@link height} and {@link ratio}.
   * @param _id id of the component to display (material or location).
   * @returns {ComponentSize} The size
   */
  getSize(_id: Id): ComponentSize {
    if (this.width && this.height) return { width: this.width, height: this.height }
    if (this.ratio && this.width) return { width: this.width, height: this.width / this.ratio }
    if (this.ratio && this.height) return { width: this.height * this.ratio, height: this.height }
    throw new Error('You must implement "getSize" or 2 of "width", "height" & "ratio" in any Component description')
  }

  /**
   * Border radius of the component.
   */
  borderRadius: number

  /**
   * Returns the border radius of the component. Default to {@link borderRadius}
   * @param _id id of the component to display (material or location).
   * @returns {number | undefined} The border radius
   */
  getBorderRadius(_id: Id): number {
    return this.borderRadius
  }
}

/**
 * Size of a component on the game table, in centimeters.
 */
export type ComponentSize = {
  width: number
  height: number
}
