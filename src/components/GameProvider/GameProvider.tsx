/** @jsxImportSource @emotion/react */
import createCache, { StylisPlugin } from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { Robot, RulesCreator } from '@gamepark/rules-api'
import { PropsWithChildren, ReactElement, useMemo } from 'react'
import { DECLARATION, Element, Middleware, prefixer } from 'stylis'
import { datadogLogs, StatusType } from '@datadog/browser-logs'
import { ApolloProvider } from '@apollo/client'
import { useWebP } from '../../hooks'
import { Animations, GameAI, gameContext, getApolloClient, LocalGameProvider, RemoteGameProvider, TutorialDescription } from '@gamepark/react-client'

const query = new URLSearchParams(window.location.search)
const gameId = query.get('game')

export type GameProviderProps<Game, Move = string, PlayerId = number> = {
  game: string
  Rules: RulesCreator<Game, Move, PlayerId>
  optionsSpec?: any
  dummy?: Robot<Game, Move, PlayerId>
  animations?: Animations
  tutorial?: TutorialDescription<Game, Move, PlayerId>,
  ai?: GameAI<Game, Move, PlayerId>
  hasSounds?: boolean
}

export type GameViewProviderProps<Game = any, GameView = Game, Move = string, MoveView = Move, PlayerId = number>
  = GameProviderProps<Game, Move, PlayerId> & {
  RulesView: RulesCreator<GameView, MoveView, PlayerId>
}

export function GameProvider<Game, Move = string, PlayerId = number>(props: PropsWithChildren<GameProviderProps<Game, Move, PlayerId>>): ReactElement

export function GameProvider<Game, View = Game, Move = string, MoveView = Move, PlayerId = number>(props: PropsWithChildren<GameViewProviderProps<Game, View, Move, MoveView, PlayerId>>): ReactElement

export function GameProvider<Game, GameView = Game, Move = string, MoveView = Move, PlayerId = number>(
  {
    children, ...props
  }: PropsWithChildren<GameProviderProps<Game, Move, PlayerId> | GameViewProviderProps<Game, GameView, Move, MoveView, PlayerId>>
) {
  const RulesView = (isGameViewProviderProps(props) ? props.RulesView : props.Rules) as RulesCreator<GameView, MoveView, PlayerId>
  const gameViewProps = { ...props, RulesView }
  const webP = useWebP()
  const emotionCache = useMemo(() => createCache({
    key: 'css', stylisPlugins: (webP ? [webPReplace, prefixer] : [prefixer]) as Array<StylisPlugin>
  }), [webP])
  return (
    <gameContext.Provider value={gameViewProps}>
      <CacheProvider value={emotionCache}>
        <ApolloProvider client={getApolloClient()}>
          {gameId ?
            <RemoteGameProvider Rules={RulesView} gameId={gameId} animations={props.animations}>{children}</RemoteGameProvider> :
            <LocalGameProvider>{children}</LocalGameProvider>
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

const isGameViewProviderProps = <Game, View, Move, MoveView, PlayerId>(
  props: GameProviderProps<Game, Move, PlayerId>
): props is GameViewProviderProps<Game, View, Move, MoveView, PlayerId> =>
  !!(props as GameViewProviderProps<Game, View, Move, MoveView, PlayerId>).RulesView
