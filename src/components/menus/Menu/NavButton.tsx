import { HTMLAttributes, PropsWithChildren } from 'react'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'

type Props = PropsWithChildren<{ url: string } & HTMLAttributes<HTMLButtonElement>>

export const NavButton = ({ children, url, ...props }: Props) => {
  return (
    <button css={[menuButtonCss, paletteMenuButtonCss]} onClick={() => window.location.href = url} {...props}>
      {children}
    </button>
  )
}
