import { css } from '@emotion/react'

export const buttonResetCss = css`
  border: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`

export const buttonCss = (color: string, focus: string, active: string) => css`
  ${buttonResetCss};

  padding: 0.2em 0.5em;
  border-radius: 2em;
  border: 0.05em solid ${color};
  color: ${color};
  background: transparent;

  &:focus, &:hover {
    background: ${focus};
  }

  &:active {
    background: ${active};
  }

  &:disabled {
    color: #555555;
    border-color: #555555;
    background: transparent;
    cursor: auto;
  }
`

export const linkButtonCss = css`
  ${buttonResetCss};

  border: none;
  text-decoration: underline;
  padding: 0;

  &:focus, &:hover, &:active {
    background: none;
  }
`
