/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC } from 'react'
import { useTheme } from '@emotion/react'

export const ThemeButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const theme = useTheme()
  return <button css={theme.buttons} {...props}/>
}
