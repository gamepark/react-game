import { css } from '@emotion/react'
import { dialogDefaultCss } from '../dialogs'
import { buttonResetCss } from '../../css'

export const menuDialogCss = css`
  ${dialogDefaultCss};

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

export const addStylesheetUrl = (url: string) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.getElementsByTagName('head')[0].appendChild(link)
}

export const backdrop = css`
  position: fixed;
  width: 100vw;
  height: 100vw;
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
