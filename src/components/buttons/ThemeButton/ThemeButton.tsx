import { ButtonHTMLAttributes, FC } from 'react'
import { useTheme } from '@emotion/react'
import { onSurfaceButtonCss } from '../../../css'

export const ThemeButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const theme = useTheme()
  // Fall back to onSurfaceButtonCss when the game does not provide
  // any theme.buttons recipe so the button still has a usable look.
  return <button css={theme.buttons ?? onSurfaceButtonCss} {...props}/>
}
