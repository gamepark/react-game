import { css, keyframes } from '@emotion/react'

export const GP_PRIMARY = '#28B8CE'

export const toolReveal = keyframes`
  from { opacity: 0; transform: translateX(-0.375em); }
  to { opacity: 1; transform: translateX(0); }
`

export const toolBtnCss = css`
  position: relative;
  display: grid;
  grid-template-columns: 1.75em 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 0.625em;
  padding: 0.625em 0.75em;
  border: none;
  border-radius: 0.5em;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  animation: ${toolReveal} 0.25s ease-out backwards;
  font-family: inherit;
  &:hover { background: rgba(40, 184, 206, 0.08); }
  &:active { background: rgba(40, 184, 206, 0.14); }
`

export const toolBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.1);
  &::after {
    content: '';
    position: absolute;
    left: 0; top: 0.5em; bottom: 0.5em;
    width: 0.2em;
    border-radius: 0 0.2em 0.2em 0;
    background: ${GP_PRIMARY};
  }
`

export const toolIconCss = css`
  grid-row: 1 / -1;
  color: ${GP_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75em; height: 1.75em;
  border-radius: 0.375em;
  background: rgba(40, 184, 206, 0.08);
`

export const toolLabelCss = css`
  font-weight: 700;
  color: #e0f0f4;
  line-height: 1.2;
`

export const toolDescCss = css`
  color: #5a8a98;
  line-height: 1.2;
`

export const activeIndicatorCss = css`
  position: absolute;
  top: 0.625em; right: 0.75em;
  width: 0.44em; height: 0.44em;
  border-radius: 50%;
  background: ${GP_PRIMARY};
  box-shadow: 0 0 0.375em rgba(40, 184, 206, 0.5);
`

export const inlineRowCss = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.25em;
  margin-top: 0.375em;
`

export const stepBtnCss = css`
  width: 1.625em; height: 1.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: ${GP_PRIMARY};
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.14); border-color: rgba(40, 184, 206, 0.4); }
`

export const numberInputCss = css`
  width: 3em; height: 1.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-weight: 700;
  text-align: center;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  &:focus { outline: none; border-color: ${GP_PRIMARY}; box-shadow: 0 0 0 0.125em rgba(40, 184, 206, 0.15); }
  &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`

export const goBtnCss = css`
  height: 1.625em;
  padding: 0 0.75em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.35);
  background: rgba(40, 184, 206, 0.15);
  color: ${GP_PRIMARY};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  margin-left: auto;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { background: rgba(40, 184, 206, 0.25); border-color: rgba(40, 184, 206, 0.5); }
`

export const playerBtnCss = css`
  height: 1.625em;
  padding: 0 0.625em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(40, 184, 206, 0.06);
  color: #5a8a98;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(40, 184, 206, 0.14); border-color: rgba(40, 184, 206, 0.4); color: #e0f0f4; }
`

export const playerBtnActiveCss = css`
  background: rgba(40, 184, 206, 0.2);
  border-color: ${GP_PRIMARY};
  color: ${GP_PRIMARY};
`

export const toggleRowCss = css`
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 0.5em;
  margin-top: 0.25em; padding: 0.25em 0;
  cursor: pointer;
`

export const checkboxCss = css`
  appearance: none;
  width: 1em; height: 1em;
  border-radius: 0.25em;
  border: 0.06em solid rgba(40, 184, 206, 0.35);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer; flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
  &:checked { background: rgba(40, 184, 206, 0.2); border-color: ${GP_PRIMARY}; }
  &:checked::after {
    content: '\u2713';
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: ${GP_PRIMARY}; font-weight: 700;
  }
  &:hover { border-color: rgba(40, 184, 206, 0.5); }
`

export const toggleLabelCss = css`
  font-weight: 600; color: #5a8a98;
`

export const optionsToggleCss = css`
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 0.375em;
  margin-top: 0.375em; padding: 0.25em 0;
  border: none; background: none;
  cursor: pointer; font-family: inherit;
  color: ${GP_PRIMARY}; font-weight: 700;
  font-size: 0.85em;
  &:hover { color: #9fe2f7; }
`

export const selectCss = css`
  margin-left: auto;
  height: 1.625em;
  padding: 0 0.5em;
  border-radius: 0.3em;
  border: 0.06em solid rgba(40, 184, 206, 0.25);
  background: rgba(0, 0, 0, 0.3);
  color: #e0f0f4;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  &:focus { outline: none; border-color: ${GP_PRIMARY}; box-shadow: 0 0 0 0.125em rgba(40, 184, 206, 0.15); }
  option { background: #0a1929; color: #e0f0f4; }
`
