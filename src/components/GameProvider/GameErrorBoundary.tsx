/** @jsxImportSource @emotion/react */
import { datadogLogs } from '@datadog/browser-logs'
import { css, keyframes } from '@emotion/react'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Component, PropsWithChildren, ReactNode } from 'react'
import { Trans } from 'react-i18next'

type GameErrorBoundaryState = {
  hasError: boolean
}

export class GameErrorBoundary extends Component<PropsWithChildren, GameErrorBoundaryState> {
  state: GameErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    datadogLogs.logger.error(`Game crash: ${error.message}`, { stack: error.stack })
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div css={containerCss}>
        <div css={cardCss}>
          <div css={iconContainerCss}>
            <FontAwesomeIcon icon={faTriangleExclamation} css={iconCss}/>
          </div>
          <p css={messageCss}>
            <Trans defaults="A technical error has occurred. The error has been sent to the Game Park team."
                   i18nKey="error.crash" ns="common"/>
          </p>
          <p css={hintCss}>
            <Trans defaults="You can refresh the page to continue your game."
                   i18nKey="error.refresh.hint" ns="common"/>
          </p>
          <button css={buttonCss} onClick={() => window.location.reload()}>
            <Trans defaults="Refresh the page" i18nKey="error.refresh.button" ns="common"/>
          </button>
          <div css={dividerCss}/>
          <p css={secondaryMessageCss}>
            <Trans defaults="If the problem persists despite refreshing and the game is corrupted, please let us know on Discord."
                   i18nKey="error.discord.hint" ns="common"/>
          </p>
          <a css={discordLinkCss} href="https://discord.gg/ZMCX5reQm8" target="_blank" rel="noopener noreferrer">
            <svg css={discordIconCss} viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77.28 77.28 0 0 0 6.89 11.1 105.45 105.45 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53.05c0-6.94 5.04-12.67 11.45-12.67S53.99 46.1 53.9 53.05c0 6.94-5.08 12.64-11.45 12.64Zm42.24 0C78.41 65.69 73.25 60 73.25 53.05c0-6.94 5.04-12.67 11.44-12.67s11.51 5.73 11.44 12.67c0 6.94-5.04 12.64-11.44 12.64Z"/>
            </svg>
            <Trans defaults="Join the Game Park Discord" i18nKey="error.discord.button" ns="common"/>
          </a>
        </div>
      </div>
    )
  }
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const containerCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 2em;
  box-sizing: border-box;
  font-family: "Mulish", sans-serif;
`

const cardCss = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 460px;
  padding: 2.5em 2.5em 2em;
  border-radius: 1.2em;
  background: #002448;
  color: #eee;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: ${fadeIn} 0.4s ease-out;
`

const iconContainerCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(40, 184, 206, 0.15);
  margin-bottom: 1.2em;
`

const iconCss = css`
  font-size: 32px;
  color: #28B8CE;
`

const messageCss = css`
  font-size: 1.05em;
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 0.3em;
`

const hintCss = css`
  font-size: 0.95em;
  line-height: 1.5;
  margin: 0;
  opacity: 0.8;
`

const buttonCss = css`
  margin-top: 1.5em;
  padding: 0.65em 2.2em;
  font-size: 1em;
  font-family: inherit;
  font-weight: 700;
  border: none;
  border-radius: 0.6em;
  background: #28B8CE;
  color: white;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  letter-spacing: 0.02em;

  &:hover {
    background: #24a5b9;
  }

  &:active {
    background: #2092a3;
    transform: scale(0.97);
  }
`

const dividerCss = css`
  width: 60%;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 1.8em 0 1.2em;
`

const secondaryMessageCss = css`
  font-size: 0.85em;
  line-height: 1.6;
  margin: 0 0 1em;
  opacity: 0.65;
`

const discordLinkCss = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em 1.4em;
  font-size: 0.9em;
  font-family: inherit;
  font-weight: 600;
  color: white;
  background: #5865F2;
  border-radius: 0.5em;
  text-decoration: none;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: #4752C4;
  }

  &:active {
    transform: scale(0.97);
  }
`

const discordIconCss = css`
  width: 20px;
  height: 20px;
`
