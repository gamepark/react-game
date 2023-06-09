/** @jsxImportSource @emotion/react */
import createCache, { StylisPlugin } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { PropsWithChildren, useMemo } from 'react'
import { DECLARATION, Element, Middleware, prefixer } from 'stylis'
import { datadogLogs, StatusType } from '@datadog/browser-logs'
import { ApolloProvider } from '@apollo/client'
import { useWebP } from '../../hooks'
import { getApolloClient, LocalGameProvider, LocalGameProviderProps, RemoteGameProvider } from '@gamepark/react-client'
import { GameContext, gameContext } from './GameContext'
import merge from 'lodash/merge'
import { isMaterialTutorial } from '../tutorial'
import { wrapRulesWithTutorial } from '../tutorial/TutorialRulesWrapper'

const query = new URLSearchParams(window.location.search)
const gameId = query.get('game')
const locale = query.get('locale') || 'en'

export type GameProviderProps<Game = any, GameView = Game, Move = string, MoveView = Move, PlayerId = number>
  = LocalGameProviderProps<Game, GameView, Move, MoveView, PlayerId> & GameContext<Game, Move, PlayerId>

export const GameProvider = <Game, GameView = Game, Move = string, MoveView = Move, PlayerId = number>(
  { material, materialI18n, locators, hasSounds, children, ...props }: PropsWithChildren<GameProviderProps<Game, GameView, Move, MoveView, PlayerId>>
) => {
  if (isMaterialTutorial(props.tutorial)) {
    wrapRulesWithTutorial(props.tutorial, props.Rules)
  }
  const { game, Rules, RulesView, optionsSpec, animations, tutorial } = props
  const webP = useWebP()
  const emotionCache = useMemo(() => createCache({
    key: 'css', stylisPlugins: (webP ? [webPReplace, prefixer] : [prefixer]) as Array<StylisPlugin>
  }), [webP])
  if (material && materialI18n && locale in materialI18n) {
    merge(material, materialI18n[locale])
  }
  return (
    <gameContext.Provider value={{ game, Rules: RulesView ?? Rules, material, locators, optionsSpec, animations, tutorial, hasSounds }}>
      <CacheProvider value={emotionCache}>
        <ApolloProvider client={getApolloClient()}>
          {gameId ?
            <RemoteGameProvider Rules={RulesView ?? Rules as any} gameId={gameId} animations={props.animations}>{children}</RemoteGameProvider> :
            <LocalGameProvider {...props}>{children}</LocalGameProvider>
          }
        </ApolloProvider>
      </CacheProvider>
    </gameContext.Provider>
  )
}

const webPReplace = (element: Element, _index: number, _children: Array<Element | string>, _callback: Middleware) => {
  if (element.type === DECLARATION) {
    element.value = element.value.replace(/url\((.*)(?:\.png|\.jpg)("|'?)\)/g, 'url($1.webp$2)')
  }
}

// Init Datadog logs
if (process.env.NODE_ENV === 'production') {
  datadogLogs.init({
    clientToken: process.env.REACT_APP_DATADOG_CLIENT_TOKEN ?? 'pubdb04a43151132f11ed7347e785e3902a',
    site: 'datadoghq.eu'
  })
  datadogLogs.logger.setLevel(process.env.REACT_APP_LOGGER_LEVEL as StatusType || StatusType.error)
  // The following code may be removed later, see: https://github.com/DataDog/browser-sdk/issues/400
  const buildMessage = (message?: any, ...optionalParams: any[]) => [message, ...optionalParams].map(param => JSON.stringify(param, undefined, 2)).join(' ')
  console.log = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.log(buildMessage(message, optionalParams), { origin: 'console' })
  console.debug = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.debug(buildMessage(message, optionalParams), { origin: 'console' })
  console.info = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.info(buildMessage(message, optionalParams), { origin: 'console' })
  console.warn = (message?: any, ...optionalParams: any[]) => datadogLogs.logger.warn(buildMessage(message, optionalParams), { origin: 'console' })
}
