import { Interpolation, Theme } from '@emotion/react'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import { MoveHistory } from '../../../hooks/useFlatHistory'
import { LogItem } from '../../Log'

type LazyLogItemProps = {
  history: MoveHistory
  itemCss: Interpolation<Theme>
  customEntryCss: Interpolation<Theme>[]
  root: HTMLDivElement | null
}

/**
 * A LogItem wrapper that only mounts the real LogItem when visible.
 * - Before first visibility: lightweight placeholder
 * - Visible: real LogItem, measures its height
 * - After leaving viewport (once measured): placeholder with exact measured height
 */
export const LazyLogItem: FC<LazyLogItemProps> = memo(({ history, itemCss, customEntryCss, root }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const measuredHeight = useRef<number | undefined>(undefined)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      setIsVisible(true)
    } else if (measuredHeight.current !== undefined) {
      setIsVisible(false)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !root) return
    const observer = new IntersectionObserver(handleIntersection, {
      root, rootMargin: '300px 0px'
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [root, handleIntersection])

  useEffect(() => {
    if (isVisible && ref.current) {
      measuredHeight.current = ref.current.offsetHeight
    }
  }, [isVisible])

  if (!isVisible) {
    return <div ref={ref} style={{ height: measuredHeight.current != null ? `${measuredHeight.current}px` : '2.8em' }}/>
  }

  return (
    <div ref={ref}>
      <LogItem history={history} css={itemCss} customEntryCss={customEntryCss}/>
    </div>
  )
})
