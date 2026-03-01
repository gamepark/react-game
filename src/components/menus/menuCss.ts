import { css, Theme } from '@emotion/react'
import { buttonResetCss } from '../../css'

export const menuDialogCss = css`
  font-size: 3.2em;

  h2 {
    margin: 0 0 0.5em;
  }

  p {
    margin: 0.5em 0;
  }
`

export const menuFontSize = css`
  font-size: 4em;
  @media only screen and (min-width: 960px) {
    font-size: 3.2em;
  }
`

export const floatingButtonCss = css`
  ${menuFontSize};
  ${buttonResetCss};
  position: fixed;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0.2em black;
  z-index: 990;
`

export const menuFloatingButtonCss = css`
  ${floatingButtonCss};
  top: 0;
  right: 0;
  border-bottom-left-radius: 25%;
`

export const menuButtonCss = css`
  ${buttonResetCss};
  display: block;
  font-size: 1.125em;
  padding: 0.2em 0.5em;
  border-radius: 2em;
  border: 0.05em solid #002448;
  margin-bottom: 0.5em;
  color: #002448;
  background: transparent;

  &:focus, &:hover {
    background: #c2ebf1;
  }

  &:active {
    background: #ade4ec;
  }

  &:disabled {
    color: #555555;
    border-color: #555555;
    background: transparent;
    cursor: auto;
  }

  > svg {
    margin-right: 0.5em;
  }
`

export const menuBaseCss = css`
  position: absolute;
  top: 0;
  max-height: 100vh;
  max-height: 100dvh;
  background: #F0FBFC;
  overflow: hidden;
  color: #002448;
  font-family: "Mulish", sans-serif;
  box-shadow: 0 0 1em black;
  transition: transform 0.5s;
  will-change: transform;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 995;
`

export const hide = css`
  transform: scale(0);
`

export const backdrop = css`
  position: fixed;
  width: 100vw;
  width: 100dvw;
  height: 100vw;
  height: 100dvw;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
  z-index: 950;
`

export const displayBackdrop = css`
  opacity: 1;
  pointer-events: auto;
`

export const paletteMenuBaseCss = (theme: Theme) => css`
  background: ${theme.palette.surface};
  color: ${theme.palette.onSurface};
  font-family: "${theme.root.fontFamily}", sans-serif;
`

export const paletteMenuButtonCss = (theme: Theme) => css`
  border-color: ${theme.palette.onSurface};
  color: ${theme.palette.onSurface};

  &:focus, &:hover {
    background: ${theme.palette.onSurfaceFocus};
  }

  &:active {
    background: ${theme.palette.onSurfaceActive};
  }

  &:disabled {
    color: ${theme.palette.disabled};
    border-color: ${theme.palette.disabled};
  }
`

export const paletteDangerButtonCss = (theme: Theme) => css`
  color: ${theme.palette.danger};
  border-color: ${theme.palette.danger};

  &:focus, &:hover {
    background: ${theme.palette.dangerHover};
  }

  &:active {
    background: ${theme.palette.dangerActive};
  }
`

export const palettePrimaryButtonCss = (theme: Theme) => css`
  background: ${theme.palette.primary};

  &:focus, &:hover {
    background: ${theme.palette.primaryHover};
  }

  &:active {
    background: ${theme.palette.primaryActive};
  }
`

export const palettePopButtonCss = (theme: Theme) => css`
  color: ${theme.palette.primary};

  &:focus, &:hover {
    background: ${theme.palette.primaryLight};
  }

  &:active {
    background: ${theme.palette.primaryLighter};
  }
`
