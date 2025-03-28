/** @jsxImportSource @emotion/react */
import { useLogControls } from '@gamepark/react-client'
import { FC } from 'react'
import { InternalLiveLogContainer, LiveLogContainerProps } from './InternalLiveLogContainer'


export const LiveLogContainer: FC<LiveLogContainerProps> = (props) => {
  const { stopped } = useLogControls()
  if (stopped) return null
  return (
    <InternalLiveLogContainer { ...props } />
  )
}
