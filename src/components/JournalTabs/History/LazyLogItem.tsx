import { Interpolation, Theme } from '@emotion/react'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import { MoveHistory } from '../../../hooks/useFlatHistory'
import { LogItem } from '../../Log'
import { useSharedIntersection } from './SharedIntersectionContext'

type LazyLogItemProps = {
  history: MoveHistory
  itemCss: Interpolation<Theme>
  customEntryCss: Interpolation<Theme>[]
}

export const LazyLogItem: FC<LazyLogItemProps> = memo(({ history, itemCss, customEntryCss }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const measuredHeight = useRef<number | undefined>(undefined)
  const shared = useSharedIntersection()

  const handleIntersection = useCallback((isIntersecting: boolean) => {
    if (isIntersecting) {
      setIsVisible(true)
    } else if (measuredHeight.current !== undefined) {
      setIsVisible(false)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !shared) return
    shared.observe(el, handleIntersection)
    return () => shared.unobserve(el)
  }, [shared, handleIntersection])

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
