import { useTheme } from '@emotion/react'
import { HTMLAttributes, PropsWithChildren } from 'react'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'

type Props = PropsWithChildren<{ url: string } & HTMLAttributes<HTMLButtonElement>>

export const NavButton = ({ children, url, ...props }: Props) => {
  const theme = useTheme()
  return (
    <button css={[menuButtonCss, paletteMenuButtonCss(theme), theme.menu?.button]} onClick={() => window.location.href = url} {...props}>
      {children}
    </button>
  )
}
