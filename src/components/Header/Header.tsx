import { css, Interpolation, Theme, ThemeProvider, useTheme } from '@emotion/react'
import { HTMLAttributes } from 'react'

export type HeaderProps = {
  buttonsCss?: Interpolation<Theme>
} & HTMLAttributes<HTMLDivElement>

export const Header = ({ buttonsCss, children, ...props }: HeaderProps) => {
  const theme = useTheme()
  // Layered button styling for the header bar. Always start with the
  // built-in structural base (padding, bold) AND the default header
  // colours, then stack the game's overrides so they only need to
  // express the delta they care about.
  //   1. headerButtonBaseCss  — structural rules (padding, font-weight)
  //   2. defaultHeaderColorsCss — default white-on-dark look. Wins for
  //                               games without any custom theme.buttons.
  //   3. theme.buttons        — game-wide button recipe override.
  //   4. theme.header.buttons — header-specific override.
  //   5. buttonsCss prop      — caller-level override.
  const resolvedButtonsCss = [
    headerButtonBaseCss,
    defaultHeaderColorsCss,
    theme.buttons,
    theme.header?.buttons,
    buttonsCss
  ]
  return (
    <ThemeProvider theme={t => ({ ...t, buttons: resolvedButtonsCss })}>
      <div css={[headerStyle, theme.header?.bar]} {...props}>
        <h1 css={titleStyle}>{children}</h1>
      </div>
    </ThemeProvider>
  )
}

const headerStyle = css`
  position: absolute;
  width: 100%;
  font-size: calc(1em * var(--gp-scale));
  height: 7em;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 0 10em;
  overflow: hidden;
`

const titleStyle = css`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0.2em 0;
  font-size: 4.5em;

  img {
    height: 1em;
    position: relative;
    top: 0.1em;
  }
`

// Structural base — applied to every header button regardless of the
// active theme. Games override visuals via theme.buttons /
// theme.header.buttons but always inherit the structural rules
// (padding, border, border-radius, cursor, focus, disabled, font
// weight) from here so they don't have to redeclare them.
const headerButtonBaseCss = css`
  cursor: pointer;
  padding: 0 0.5em;
  border-radius: 2em;
  border: 0.05em solid currentColor;
  background: transparent;
  font-weight: bold;

  &:focus { outline: none; }

  &:disabled {
    color: #555555;
    border-color: #555555;
    cursor: auto;
    opacity: 0.5;
  }
`

// Default colours — only takes effect when the game has not provided
// a theme.buttons override. Preserves the original white-on-dark look
// of the header bar.
const defaultHeaderColorsCss = css`
  color: #ffffff;

  &:focus, &:hover { background: #555555; }
  &:active { background: #888888; }
`
