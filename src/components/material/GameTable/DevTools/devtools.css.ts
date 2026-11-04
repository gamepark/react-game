import { css } from '@emotion/react'

/** The colors of the dev tools: they read their values from the theme set on the anchor, so that a tool never picks a color itself */
export const nightThemeCss = css`
  --dt-surface: #002448;
  --dt-text: #E8F5F9;
  --dt-muted: #9DBAC6;
  --dt-line: #1F4E75;
  --dt-field: #00172E;
  --dt-hover: rgba(159, 226, 247, 0.1);
  --dt-icon: #28B8CE;
  --dt-icon-bg: #0A3A66;
  --dt-link: #9FE2F7;
  --dt-primary: #28B8CE;
  --dt-on-primary: #002448;
  --dt-active: #28B8CE;
  --dt-on-active: #002448;
  --dt-head: #002448;
  --dt-on-head: #E8F5F9;
  --dt-fab: #28B8CE;
  --dt-on-fab: #002448;
  --dt-danger: #FF9A8F;
`

export const dayThemeCss = css`
  --dt-surface: #FFFFFF;
  --dt-text: #002448;
  --dt-muted: #4F6B82;
  --dt-line: #D5E3EA;
  --dt-field: #EEF5F8;
  --dt-hover: rgba(0, 36, 72, 0.06);
  --dt-icon: #0E7F93;
  --dt-icon-bg: #E1F4F8;
  --dt-link: #0E7F93;
  --dt-primary: #FFB23F;
  --dt-on-primary: #002448;
  --dt-active: #002448;
  --dt-on-active: #FFFFFF;
  --dt-head: #28B8CE;
  --dt-on-head: #002448;
  --dt-fab: #FFFFFF;
  --dt-on-fab: #0E7F93;
  --dt-danger: #C62828;
`

const BOTS_ON = '#FFB23F'
const FAB_SIZE = '44px'
const GAP = '8px'

const focusCss = css`
  &:focus-visible { outline: 2px solid var(--dt-active); outline-offset: 1px; }
`

const controlCss = css`
  ${focusCss};
  box-sizing: border-box;
  font: inherit;
  cursor: pointer;
`

// ── The hub ──

/** Keeps the font size of the table: a fabBottom given in em by a game must not depend on the size of the text of the tools */
export const anchorCss = css`
  position: fixed;
  left: 1em;
  bottom: var(--dt-bottom);
  z-index: 1700;
`

export const backdropCss = css`
  position: fixed;
  inset: 0;
  z-index: 1699;
`

export const fabCss = css`
  ${controlCss};
  width: ${FAB_SIZE};
  height: ${FAB_SIZE};
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  background: var(--dt-fab);
  color: var(--dt-on-fab);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5);
`

export const logoCss = css`
  width: 22px;
  height: 22px;
  fill: currentColor;
`

/** As tall as the room above the button: whatever their content, the panels stay on the screen */
export const hubCss = css`
  position: absolute;
  left: 0;
  bottom: calc(${FAB_SIZE} + ${GAP});
  height: calc(100vh - var(--dt-bottom) - ${FAB_SIZE} - ${GAP} - ${GAP});
  display: flex;
  align-items: flex-end;
  gap: ${GAP};
  pointer-events: none;
`

const panelCss = css`
  box-sizing: border-box;
  max-height: 100%;
  pointer-events: auto;
  background: var(--dt-surface);
  color: var(--dt-text);
  border: 1px solid var(--dt-line);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Mulish', sans-serif;
  font-size: 13px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
`

export const mainMenuCss = css`
  ${panelCss};
  position: relative;
  flex: none;
  width: 196px;
`

export const subPanelCss = css`
  ${panelCss};
  width: min(376px, calc(100vw - 196px - 48px));
  display: flex;
  flex-direction: column;
  padding: 6px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #28B8CE transparent;
`

export const panelHeaderCss = css`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 8px 0 14px;
  background: var(--dt-head);
  color: var(--dt-on-head);
  border-bottom: 1px solid var(--dt-line);
  border-radius: 11px 11px 0 0;
`

export const headerLogoCss = css`
  width: 16px;
  height: 16px;
  flex: none;
  fill: currentColor;
`

export const panelTitleCss = css`
  flex: 1;
  font-size: 14px;
  font-weight: 800;
`

export const themeBtnCss = css`
  ${controlCss};
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  &:hover { background: var(--dt-hover); }
`

export const menuListCss = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
`

export const menuItemCss = css`
  ${controlCss};
  height: 38px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  &:hover { background: var(--dt-hover); }
`

export const menuItemActiveCss = css`
  background: var(--dt-active);
  color: var(--dt-on-active);
  &:hover { background: var(--dt-active); }
`

export const menuItemLabelCss = css`
  flex: 1;
`

export const menuChevronCss = css`
  font-size: 11px;
`

export const flashCss = css`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + ${GAP});
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--dt-primary);
  color: var(--dt-on-primary);
  font-weight: 800;
  text-align: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  pointer-events: none;
`

// ── The tools ──

/** Puts a line between the tools of a list */
export const toolListCss = css`
  display: flex;
  flex-direction: column;
  flex: none;
  && > * + * { border-top: 1px solid var(--dt-line); }
`

export const toolBtnCss = css`
  ${focusCss};
  flex: none;
  box-sizing: border-box;
  width: 100%;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 10px;
  padding: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  &:is(button) { cursor: pointer; }
  &:is(button):hover { background: var(--dt-hover); }
`

/** A tool with its controls on its right, rather than below it */
export const toolInlineCss = css`
  grid-template-columns: 32px minmax(0, 1fr) auto;
`

export const toolEndCss = css`
  grid-column: 3;
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  gap: 4px;
`

export const toolIconCss = css`
  grid-row: 1 / 3;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--dt-icon-bg);
  color: var(--dt-icon);
`

export const toolLabelCss = css`
  font-size: 14px;
  font-weight: 800;
`

export const toolDescCss = css`
  color: var(--dt-muted);
`

export const inlineRowCss = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
`

export const stepBtnCss = css`
  ${controlCss};
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--dt-line);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 16px;
  font-weight: 700;
  &:hover { background: var(--dt-hover); }
`

export const numberInputCss = css`
  ${focusCss};
  flex: none;
  box-sizing: border-box;
  width: 44px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: var(--dt-field);
  color: inherit;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`

export const textInputCss = css`
  ${focusCss};
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--dt-line);
  border-radius: 8px;
  background: var(--dt-field);
  color: inherit;
  font: inherit;
  &::placeholder { color: var(--dt-muted); }
`

export const goBtnCss = css`
  ${controlCss};
  flex: none;
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--dt-primary);
  color: var(--dt-on-primary);
  font-weight: 800;
  &:hover { filter: brightness(1.08); }
`

export const secondaryBtnCss = css`
  ${controlCss};
  flex: none;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dt-line);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-weight: 700;
  &:hover { background: var(--dt-hover); }
`

export const optionsToggleCss = css`
  ${controlCss};
  flex: none;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--dt-link);
  font-weight: 700;
  &:hover { background: var(--dt-hover); }
`

/** As many in a row as fit, however many players: a table of 15 makes 3 rows of them */
export const playerGridCss = css`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  gap: 4px;
  margin-top: 8px;
`

export const playerBtnCss = css`
  ${controlCss};
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dt-line);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-weight: 800;
  text-decoration: none;
  &:hover { background: var(--dt-hover); }
`

export const playerBtnActiveCss = css`
  border-color: var(--dt-active);
  background: var(--dt-active);
  color: var(--dt-on-active);
  &:hover { background: var(--dt-active); }
`

export const segmentedCss = css`
  grid-column: 1 / -1;
  display: flex;
  margin-top: 8px;
  padding: 2px;
  border-radius: 8px;
  background: var(--dt-field);
`

export const segmentCss = css`
  ${controlCss};
  flex: 1;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-weight: 800;
  &:hover { background: var(--dt-hover); }
`

export const segmentActiveCss = css`
  background: var(--dt-active);
  color: var(--dt-on-active);
  &:hover { background: var(--dt-active); }
`

export const switchCss = css`
  width: 40px;
  height: 22px;
  box-sizing: border-box;
  padding: 2px;
  display: flex;
  justify-content: flex-start;
  border-radius: 11px;
  background: var(--dt-muted);
  &::after {
    content: '';
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #FFFFFF;
  }
`

export const switchOnCss = css`
  justify-content: flex-end;
  background: ${BOTS_ON};
`

// ── The options of a new game ──

export const optionsBoxCss = css`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--dt-field);
`

export const toggleRowCss = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
`

export const toggleLabelCss = css`
  overflow-wrap: anywhere;
`

export const checkLabelCss = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`

export const checkboxCss = css`
  ${focusCss};
  flex: none;
  margin: 0;
  accent-color: var(--dt-active);
  cursor: pointer;
`

export const triStateCss = css`
  ${controlCss};
  flex: none;
  width: 28px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--dt-line);
  border-radius: 6px;
  background: transparent;
  color: var(--dt-muted);
  font-weight: 800;
  &[data-state="true"] { border-color: var(--dt-active); background: var(--dt-active); color: var(--dt-on-active); }
  &[data-state="false"] { border-color: #D9534F; background: #D9534F; color: #FFFFFF; }
`

export const selectCss = css`
  ${controlCss};
  flex: 1;
  min-width: 0;
  height: 26px;
  border: 1px solid var(--dt-line);
  border-radius: 6px;
  background: var(--dt-surface);
  color: inherit;
  option { background: var(--dt-surface); color: var(--dt-text); }
`

export const seatsTitleCss = css`
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--dt-line);
  font-weight: 700;
`

/** 2 columns: at 15 players, that makes 8 lines rather than 15 */
export const seatGridCss = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 10px;
`

export const seatLabelCss = css`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`

export const seatNameCss = css`
  flex: none;
  width: 26px;
  font-weight: 700;
`

// ── The lists of the panels ──

export const dividerCss = css`
  flex: none;
  height: 1px;
  margin: 0 10px;
  background: var(--dt-line);
`

export const listCss = css`
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 10px;
`

export const listRowCss = css`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 38px;
  padding: 0 3px 0 10px;
  border-radius: 8px;
  background: var(--dt-field);
`

export const listLabelCss = css`
  flex: 1;
  min-width: 0;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const iconBtnCss = css`
  ${controlCss};
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dt-icon);
  &:hover { background: var(--dt-hover); }
`

export const iconBtnDangerCss = css`
  color: var(--dt-muted);
  &:hover { color: var(--dt-danger); }
`

// ── The dialog to paste a state ──

export const modalBackdropCss = css`
  position: fixed;
  inset: 0;
  z-index: 1800;
  background: rgba(0, 0, 0, 0.6);
`

export const modalCss = css`
  ${panelCss};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1801;
  width: min(560px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`

export const modalHeaderCss = css`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 12px 16px;
  border-bottom: 1px solid var(--dt-line);
  font-size: 14px;
  font-weight: 800;
`

export const modalBodyCss = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  overflow-y: auto;
`

export const modalTextareaCss = css`
  ${focusCss};
  box-sizing: border-box;
  width: 100%;
  min-height: 140px;
  padding: 10px;
  border: 1px solid var(--dt-line);
  border-radius: 8px;
  background: var(--dt-field);
  color: inherit;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  &::placeholder { color: var(--dt-muted); }
`

export const pasteErrorCss = css`
  font-weight: 800;
  color: var(--dt-danger);
`

export const modalFooterCss = css`
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--dt-line);
`
