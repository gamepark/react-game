/** @jsxImportSource @emotion/react */
import { HTMLAttributes, PropsWithChildren } from 'react'
import { menuButtonCss } from '../menuCss'

type Props = PropsWithChildren<{ url: string } & HTMLAttributes<HTMLButtonElement>>

export const NavButton = ({ children, url, ...props }: Props) => (
  <button css={menuButtonCss} onClick={() => window.location.href = url} {...props}>
    {children}
  </button>
)
