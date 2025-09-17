import { css } from '@emotion/react'
import { forwardRef, HTMLAttributes, memo, useMemo } from 'react'
import { sizeCss } from '../../css'
import { useMaterialDescription } from '../../hooks'

export type MaterialComponentProps<M extends number = number, ItemId = any> = {
  type: M
  itemId?: ItemId
  itemIndex?: number
  highlight?: boolean
  playDown?: boolean
  preview?: boolean
} & HTMLAttributes<HTMLElement>

export const MaterialComponent = memo(forwardRef<HTMLDivElement, MaterialComponentProps>((
  { type, itemId, itemIndex, highlight, playDown, preview, ...props }, ref
) => {
  const description = useMaterialDescription(type)

  if (!description) return null

  const { width, height } = description.getSize(itemId)

  const componentCss = useMemo(() => [materialCss, sizeCss(width, height)], [width, height])

  return (
    <div ref={ref} css={componentCss} {...props}>
      <div css={hoverWrapper}>
        {description.content({ type, itemId, highlight, playDown, preview, itemIndex, ...props })}
      </div>
    </div>
  )
}))

const hoverWrapper = css`
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
  transform-origin: center;
  width: 100%;
  height: 100%;
`

MaterialComponent.displayName = 'MaterialComponent'

const materialCss = css`
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
`
