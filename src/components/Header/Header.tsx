import { css, Interpolation, Theme, ThemeProvider } from '@emotion/react'
import { HTMLAttributes } from 'react'
import { buttonCss } from '../../css'

export type HeaderProps = {
  buttonsCss?: Interpolation<Theme>
} & HTMLAttributes<HTMLDivElement>

export const Header = ({ buttonsCss = defaultButtonsCss, children, ...props }: HeaderProps) => (
  <ThemeProvider theme={theme => ({ ...theme, buttons: buttonsCss })}>
    <div css={headerStyle} {...props}>
      <h1 css={titleStyle}>{children}</h1>
    </div>
  </ThemeProvider>
)

const headerPadding = 10 // em
const fontSize = 4.5 // em

const headerStyle = css`
  position: absolute;
  width: 100%;
  height: 7em;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 0 ${headerPadding}em;
  overflow: hidden;
`

const titleStyle = css`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0.2em 0;
  font-size: ${fontSize}em;
  
  img {
    height: 1em;
    position: relative;
    top: 0.1em;
  }
`

const defaultButtonsCss = css`
  ${buttonCss('#ffffff', '#555555', '#888888')};
  padding: 0 0.5em;
  font-weight: bold;
`