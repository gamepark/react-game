import { ApolloProvider } from '@apollo/client/react'
import { datadogLogs, StatusType } from '@datadog/browser-logs'
import { css, Global, Theme, ThemeProvider } from '@emotion/react'
import { getApolloClient, LocalGameProvider, LocalGameProviderProps, RemoteGameProvider } from '@gamepark/react-client'
import { merge } from 'es-toolkit'
import { PropsWithChildren, useEffect } from 'react'
import { BackgroundTheme, defaultTheme } from '../../css'
import { normalize } from '../../css/normalize'
import { DeepPartial } from '../../utilities'
import { isMaterialTutorial } from '../tutorial'
import { wrapRulesWithTutorial } from '../tutorial/TutorialRulesWrapper'
import { GameContext, gameContext } from './GameContext'

const query = new URLSearchParams(window.location.search)
const gameId = query.get('game')
const locale = query.get('locale') || 'en'

export type GameProviderProps<Game = any, GameView = Game, Move = string, MoveView = Move, PlayerId extends number = number>
  = LocalGameProviderProps<Game, GameView, Move, MoveView, PlayerId> & GameContext<Game, Move, PlayerId> & {
  theme?: DeepPartial<Theme>
}

export const GameProvider = <Game, GameView = Game, Move = string, MoveView = Move, PlayerId extends number = number>(
  { materialI18n, theme = {}, children, ...props }: PropsWithChildren<GameProviderProps<Game, GameView, Move, MoveView, PlayerId>>
) => {
  useEffect(() => {
    if (isMaterialTutorial(props.tutorial)) {
      wrapRulesWithTutorial(props.tutorial, props.Rules)
    }
  }, [props.tutorial, props.Rules])

  if (props.material && materialI18n && locale in materialI18n) {
    merge(props.material, materialI18n[locale])
  }
  return (
    <gameContext.Provider value={props as GameContext}>
        <ThemeProvider theme={merge(defaultTheme, theme)}>
          <Global styles={[normalize, globalCss]}/>
          <ApolloProvider client={getApolloClient()}>
            {gameId ?
              <RemoteGameProvider gameId={gameId} {...props}>{children}</RemoteGameProvider> :
              <LocalGameProvider {...props}>{children}</LocalGameProvider>
            }
          </ApolloProvider>
        </ThemeProvider>
    </gameContext.Provider>
  )
}

// Init Datadog logs
if (process.env.NODE_ENV === 'production') {
  datadogLogs.init({
    clientToken: process.env.DATADOG_CLIENT_TOKEN ?? 'pubdb04a43151132f11ed7347e785e3902a',
    site: 'datadoghq.eu'
  })
  datadogLogs.logger.setLevel(process.env.LOGGER_LEVEL as StatusType || StatusType.error)
  // The following code may be removed later, see: https://github.com/DataDog/browser-sdk/issues/400
  const buildMessage = (message?: any, ...optionalParams: any[]) => [message, ...optionalParams].map(param => JSON.stringify(param, undefined, 2)).join(' ')
  console.log = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.log(buildMessage(message, optionalParams), { origin: 'console' })
  console.debug = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.debug(buildMessage(message, optionalParams), { origin: 'console' })
  console.info = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.info(buildMessage(message, optionalParams), { origin: 'console' })
  console.warn = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.warn(buildMessage(message, optionalParams), { origin: 'console' })
}

const globalCss = (theme: Theme) => css`
  html {
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: inherit;
  }

  body {
    margin: 0;
    font-family: "${theme.root.fontFamily}", sans-serif;
  }

  #root {
    position: absolute;
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    width: 100dvw;
    -webkit-touch-callout: none;
    user-select: none;
    overflow: hidden;
    color: #eee;
    // Disable native zoom
    touch-action: none;
    ${backgroundCss(theme.root.background)};
  }

  /* Chrome, Edge, and Safari */

  *::-webkit-scrollbar {
    width: 6px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`

const backgroundCss = ({ image, overlay }: BackgroundTheme) => overlay ?
  css`
    background: linear-gradient(${overlay}, ${overlay}), url(${image}) center / cover, black;
  ` :
  css`
    background: url(${image}) center / cover, black;
  `
