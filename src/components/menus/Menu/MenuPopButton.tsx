/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { HTMLAttributes, useEffect, useState } from 'react'
import { menuFloatingButtonCss } from '../menuCss'

type Props = {
  pop?: boolean
  popPosition?: number
} & HTMLAttributes<HTMLButtonElement>

export const MenuPopButton = ({ pop, popPosition = 1, ...props }: Props) => {
  const [doPop, setDoPop] = useState<boolean>()
  useEffect(() => {
    if (!pop || doPop === undefined) {
      const timeout = setTimeout(() => setDoPop(pop), 200)
      return () => clearTimeout(timeout)
    } else {
      setDoPop(pop)
    }
  }, [pop])
  return <button css={[style, doPop && popStyle(popPosition)]} disabled={!pop} {...props}/>
}

const style = css`
  ${menuFloatingButtonCss};
  height: 2.25em;
  width: 2.5em;
  padding: 0 0.25em 0 0;
  transition: transform 0.3s;
  will-change: transform;
`

const popStyle = (position: number) => css`
  transform: translateX(${-2.25 * position}em);
`