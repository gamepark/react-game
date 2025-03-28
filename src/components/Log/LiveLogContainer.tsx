/** @jsxImportSource @emotion/react */
import { useLogControls } from '@gamepark/react-client/dist/Log'
import { FC } from 'react'
import { InternalLiveLogContainer, LiveLogContainerProps } from './InternalLiveLogContainer'


export const LiveLogContainer: FC<LiveLogContainerProps> = (props) => {
  const { stopped } = useLogControls()
  if (stopped) return null
  return (
    <InternalLiveLogContainer { ...props } />
  )
}
