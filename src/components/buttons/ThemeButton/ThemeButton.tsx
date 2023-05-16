/** @jsxImportSource @emotion/react */
import { FC, HTMLAttributes } from 'react'
import { useTheme } from '@emotion/react'

export const ThemeButton: FC<HTMLAttributes<HTMLButtonElement>> = (props) => {
  const theme = useTheme()
  return <button css={theme.buttons} {...props}/>
}
