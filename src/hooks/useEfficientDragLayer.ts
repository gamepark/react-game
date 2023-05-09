import {shallowEqual} from '@react-dnd/shallowequal'
import {useCallback, useRef} from 'react'
import {DragLayerMonitor, useDragLayer} from 'react-dnd'

export function useEfficientDragLayer<CollectedProps>(collect: (monitor: DragLayerMonitor) => CollectedProps): CollectedProps {
  const requestID = useRef<number>()
  const collectCallback = useCallback(monitor => requestID.current === undefined ? {data: collect(monitor)} : undefined, [collect])
  const collected = useDragLayer(collectCallback)
  const result = useRef(collected?.data)
  if (collected && !shallowEqual(result.current, collected.data)) {
    result.current = collected.data
    requestID.current = requestAnimationFrame(() => requestID.current = undefined)
  }
  return result.current!
}