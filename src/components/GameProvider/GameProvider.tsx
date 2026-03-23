import { datadogLogs, StatusType } from '@datadog/browser-logs'
import { css, Global, Theme, ThemeProvider } from '@emotion/react'
import { LocalGameProvider, LocalGameProviderProps, RemoteGameProvider, TRPCProvider } from '@gamepark/react-client'
import { merge } from 'es-toolkit'
import { PropsWithChildren, useEffect } from 'react'
import { BackgroundTheme, defaultTheme } from '../../css'
import { normalize } from '../../css/normalize'
import { DeepPartial } from '../../utilities'
import { setupTranslation } from '../../utilities/translation.util'
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
  setupTranslation(props.game)
  initDatadog(props.game)

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
        <TRPCProvider>
          {gameId ?
            <RemoteGameProvider gameId={gameId} {...props}>{children}</RemoteGameProvider> :
            <LocalGameProvider {...props}>{children}</LocalGameProvider>
          }
        </TRPCProvider>
      </ThemeProvider>
    </gameContext.Provider>
  )
}

// Init Datadog logs
let datadogInitialized = false

function initDatadog(service: string) {
  if (datadogInitialized || process.env.NODE_ENV !== 'production') return
  datadogInitialized = true
  datadogLogs.init({
    clientToken: process.env.DATADOG_CLIENT_TOKEN ?? 'pubdb04a43151132f11ed7347e785e3902a',
    site: 'datadoghq.eu',
    service,
    version: process.env.VERSION,
    beforeSend: (event) => !event.message?.includes('sockjs') && !event.message?.includes('Script error')
  })
  datadogLogs.logger.setLevel(process.env.LOGGER_LEVEL as StatusType || StatusType.error)
  // The following code may be removed later, see: https://github.com/DataDog/browser-sdk/issues/400
  const buildMessage = (message?: any, ...optionalParams: any[]) => [message, ...optionalParams].map(param => JSON.stringify(param, undefined, 2)).join(' ')
  console.log = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.log(buildMessage(message, optionalParams), { origin: 'console' })
  console.debug = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.debug(buildMessage(message, optionalParams), { origin: 'console' })
  console.info = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.info(buildMessage(message, optionalParams), { origin: 'console' })
  console.warn = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.warn(buildMessage(message, optionalParams), { origin: 'console' })
  console.error = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.error(buildMessage(message, optionalParams), { origin: 'console' })
}

const globalCss = (theme: Theme) => css`
  :root {
    --gp-primary: ${theme.palette.primary};
    --gp-primary-hover: ${theme.palette.primaryHover};
    --gp-primary-active: ${theme.palette.primaryActive};
    --gp-primary-light: ${theme.palette.primaryLight};
    --gp-primary-lighter: ${theme.palette.primaryLighter};
    --gp-surface: ${theme.palette.surface};
    --gp-on-surface: ${theme.palette.onSurface};
    --gp-on-surface-focus: ${theme.palette.onSurfaceFocus};
    --gp-on-surface-active: ${theme.palette.onSurfaceActive};
    --gp-danger: ${theme.palette.danger};
    --gp-danger-hover: ${theme.palette.dangerHover};
    --gp-danger-active: ${theme.palette.dangerActive};
    --gp-disabled: ${theme.palette.disabled};
    --gp-dialog-bg: ${theme.dialog.backgroundColor};
    --gp-dialog-color: ${theme.dialog.color};
    --gp-font-family: "${theme.root.fontFamily}", sans-serif;
    --gp-result-border: ${theme.result?.border ?? theme.palette.primary};
    --gp-result-icon: ${theme.result?.icon ?? theme.palette.onSurface};
    --gp-timestats-think-bg: ${theme.timeStats?.thinkBackground ?? '#fff3e3'};
    --gp-timestats-wait-bg: ${theme.timeStats?.waitBackground ?? '#b3e9f0'};
    --gp-ring-color-1: ${theme.playerPanel?.activeRingColors?.[0] ?? 'gold'};
    --gp-ring-color-2: ${theme.playerPanel?.activeRingColors?.[1] ?? theme.palette.primary};
    --gp-scale: 1;
  }

  @media only screen and (min-height: 600px) {
    :root {
      --gp-scale: 0.8;
    }
  }

  html {
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: inherit;
  }

  body {
    margin: 0;
    font-family: var(--gp-font-family);
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
