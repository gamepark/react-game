/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { HTMLAttributes, useEffect, useState } from 'react'
import { menuFloatingButtonCss } from '../menuCss'

type Props = {
  pop?: boolean
  popPosition?: number
} & HTMLAttributes<HTMLButtonElement>

export const MenuPopButton = ({ children, pop, popPosition = 1, ...props }: Props) => {
  const [popAfterCreation, setPopAfterCreation] = useState<boolean>()
  useEffect(() => {
    if (popAfterCreation === undefined) {
      setTimeout(() => setPopAfterCreation(pop), 100)
    } else {
      setPopAfterCreation(pop)
    }
  }, [pop])
  return (
    <button css={[style, popAfterCreation && popStyle(popPosition)]} {...props}>{children}</button>
  )
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