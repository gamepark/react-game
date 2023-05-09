/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { forwardRef, HTMLAttributes, useMemo } from 'react'
import { DragLayerMonitor, XYCoord } from 'react-dnd'
import { useEfficientDragLayer } from '../../hooks'

export type DragAroundProps = {
  dragging: boolean
  preTransform?: string
  postTransform?: string
  animation?: CssAnimation
  projection?: Projection
  css?: Interpolation<Theme>
} & HTMLAttributes<HTMLDivElement>

export type CssAnimation = {
  seconds: number
  delay?: number
  properties?: string[]
  timingFunction?: string
}

export type Projection = (monitor: DragLayerMonitor) => XYCoord & { z?: number } | null

const defaultProjection: Projection = (monitor: DragLayerMonitor) => monitor.getDifferenceFromInitialOffset()

export const DragAround = forwardRef<HTMLDivElement, DragAroundProps>((
  { children, dragging, preTransform, postTransform, animation, projection = defaultProjection, ...props }, ref) => {
  const transition = useMemo(() => {
    const transitionProperty = animation?.properties?.join(', ') ?? 'transform'
    return css`
      transition-property: ${transitionProperty};
      will-change: ${transitionProperty};
      transition-duration: ${animation?.seconds ?? 0.2}s;
      transition-timing-function: ${animation?.timingFunction ?? 'ease-in-out'};
    `
  }, [animation])
  const offset = useEfficientDragLayer(projection)
  const transform = useMemo(() => {
    const transformations: string[] = []
    if (preTransform) transformations.push(preTransform)
    if (dragging && offset) transformations.push(`translate3d(${Math.round(offset.x)}px, ${Math.round(offset.y)}px, ${offset.z ?? 0}em)`)
    if (postTransform) transformations.push(postTransform)
    if (dragging && offset) transformations.push('!important')
    return transformations.length > 0 ? css`transform: ${transformations.join(' ')};` : undefined
  }, [dragging, offset, preTransform, postTransform])
  return (
    <div ref={ref} css={[transition, transform, dragging && draggingStyle]} {...props}>
      {children}
    </div>
  )
})

const draggingStyle = css`
  transition: none;
  z-index: 1000 !important;
  pointer-events: none;
`
