import { useTheme } from '@emotion/react'
import { HTMLAttributes, PropsWithChildren } from 'react'
import { goToPlatform } from '../../../utilities/platform.util'
import { menuButtonCss, paletteMenuButtonCss } from '../menuCss'

type Props = PropsWithChildren<{ url: string } & HTMLAttributes<HTMLButtonElement>>

export const NavButton = ({ children, url, ...props }: Props) => {
  const theme = useTheme()
  return (
    <button css={[menuButtonCss, paletteMenuButtonCss, theme.menu?.button]} onClick={() => goToPlatform(url)} {...props}>
      {children}
    </button>
  )
}
