import { css, useTheme } from '@emotion/react'
import { faChessPawn } from '@fortawesome/free-solid-svg-icons/faChessPawn'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, PLATFORM_URI, useGameSelector } from '@gamepark/react-client'
import { isCompetitive } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayerName, useRankedPlayers, useResultText, useRules } from '../../../hooks'
import { Avatar } from '../../Avatar'
import { GamePoints } from '../../GamePoints'
import { gameContext } from '../../GameProvider'
import { Medal } from '../../menus'
import { NavButton } from '../../menus/Menu/NavButton'
import { RestartTutorialButton } from '../../menus/RestartTutorialButton'
import { Dialog, DialogProps } from '../Dialog'
import { RematchSection } from './RematchSection'
import { usePlayerScoring, useScoringHeader } from './useScoringTable'

type Props = DialogProps & {
  openDialog: () => void
  close: () => void
}

const query = new URLSearchParams(window.location.search)
const locale = query.get('locale') || 'en'
const gameId = query.get('game')


export const ResultDialog = ({ openDialog, close, ...props }: Props) => {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const rankedPlayers = useRankedPlayers()
  const context = useContext(gameContext)
  const rules = useRules()!
  const gameMode = useGameSelector((state) => state.gameMode)
  const tournament = useGameSelector((state) => state.tournament)
  const scoringCells = useScoringHeader()
  let row = (gameMode === GameMode.TOURNAMENT ? 3 : gameMode === GameMode.COMPETITIVE ? 2 : 1) + (scoringCells?.length ?? 0)

  const borderColor = theme.result?.border ?? theme.palette.primary
  const iconColor = theme.result?.icon ?? theme.palette.onSurface

  const resultText = useResultText()
  return (
    <Dialog onBackdropClick={close} css={[style, theme.result?.container]} {...props}>
      <FontAwesomeIcon icon={faXmark} css={[closeIcon, theme.result?.closeIcon]} onClick={close}/>
      <div css={scrollableContent}>
        <h2>{resultText}</h2>
        <div css={buttonLine}>
          {gameMode === GameMode.TOURNAMENT && tournament ?
            <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/tournaments/${tournament.number}`}>
              {t('result.tournament.link')}
            </NavButton>
            :
            <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${context.game}`}>{t('Back to Game Park')}</NavButton>
          }
          {gameMode === GameMode.COMPETITIVE &&
            <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/play?mode=matchmaking`}>
              {t('Play again')}
            </NavButton>
          }
          {gameMode === GameMode.COMPETITIVE &&
            <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/ranking`}>
              {t('See overall ranking')}
            </NavButton>
          }
        </div>
        <div css={[gridCss, row > 1 ? multiRows(rankedPlayers.length, row) : singleRow(rankedPlayers.length)]}>
          {row > 1 && <div css={stickyHeader(theme.dialog.backgroundColor)}/>}
          {gameMode === GameMode.TOURNAMENT && <div css={[borderTopCss(borderColor), left]}>{t('Tournament')}</div>}
          {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) && <div css={[borderTopCss(borderColor), left]}>{t('Ranking')}</div>}
          {scoringCells.map((cell, index) => (
            <div css={[borderTopCss(borderColor), left]} key={index}>
              {cell}
            </div>
          ))}
          {rankedPlayers.map((player, index) =>
            <PlayerDisplay key={index}
                           playerId={player.id}
                           gameMode={gameMode}
                           rank={isCompetitive(rules) && player.rank <= 3 ? player.rank : undefined}
                           border={row > 1}
                           borderColor={borderColor}
                           iconColor={iconColor}
                           backgroundColor={theme.dialog.backgroundColor}
            />)
          }
        </div>
        {gameMode === GameMode.TUTORIAL &&
          <div>
            <p css={css`white-space: break-spaces;`}>{t('tuto.over')}</p>
            <p css={buttonsLine}>
              <RestartTutorialButton/>
              <NavButton url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/play`} css={css`margin-left: 1em;`}>
                <FontAwesomeIcon icon={faChessPawn}/>{t('Play')}
              </NavButton>
            </p>
          </div>
        }
        {gameId !== null && <RematchSection openDialog={openDialog}/>}
      </div>
    </Dialog>
  )
}

const PlayerDisplay = ({ gameMode, playerId, rank, border, borderColor, iconColor, backgroundColor }: {
  gameMode?: GameMode,
  playerId: any,
  rank?: number,
  border: boolean,
  borderColor: string,
  iconColor: string,
  backgroundColor: string
}) => {
  const playerName = usePlayerName(playerId)
  const tournamentPoints = useGameSelector((state) => state.players.find(p => p.id === playerId)?.tournamentPoints ?? undefined)
  const playerData = usePlayerScoring(playerId)
  return <>
    <div css={[relative, border && borderLeftCss(borderColor), stickyHeader(backgroundColor)]}>
      <div css={avatarContainer}>
        <Avatar playerId={playerId} css={avatarCss}/>
        {rank !== undefined && <Medal rank={rank} css={medalCssFn(iconColor)}/>}
      </div>
      <span>{playerName}</span>
    </div>
    {gameMode === GameMode.TOURNAMENT &&
      <div css={[borderLeftCss(borderColor), borderTopCss(borderColor), centered]}>
        {tournamentPoints !== undefined && <><FontAwesomeIcon icon={faTrophy} css={trophyIconCss(borderColor)}/><span>+{tournamentPoints}</span></>}
      </div>
    }
    {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) &&
      <div css={[borderLeftCss(borderColor), borderTopCss(borderColor), centered]}>
        <GamePoints playerId={playerId}/>
      </div>
    }
    {playerData.map((cell, index) => (
      <div css={[borderLeftCss(borderColor), borderTopCss(borderColor)]} key={index}>
        {cell}
      </div>
    ))}
  </>
}

const centered = css`
  > * {
    justify-content: center;
  }
`

const style = css`
  font-size: 2.5em;
  text-align: center;
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;

  > h2 {
    margin: 0 1em 0.5em;
  }
`

const scrollableContent = css`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`

const closeIcon = css`
  position: absolute;
  right: 0.8em;
  top: 0.6em;
  font-size: 1.3em;
  cursor: pointer;
  z-index: 1;
`

const stickyHeader = (backgroundColor: string) => css`
  position: sticky;
  top: 0;
  background-color: ${backgroundColor};
  z-index: 1;
  padding-top: 0.3em;
  padding-bottom: 0.3em;
`

const buttonLine = css`
  display: flex;
  justify-content: space-evenly;
`

const gridCss = css`
  display: grid;
  grid-auto-flow: column;
  padding: 0.5em;

  > div {
    padding: 0.6em;
  }
`

const multiRows = (players: number, rows: number) => css`
  grid-template-columns: auto repeat(${players}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
`

const singleRow = (players: number) => css`
  grid-template-columns: repeat(${players}, 1fr);
  justify-items: center;
`

const avatarContainer = css`
  position: relative;
  width: 2em;
  height: 2em;
  margin: auto auto 0.3em;
`

const avatarCss = css`
  position: relative;
  width: 2em;
  height: 2em;
`

const medalCssFn = (color: string) => css`
  width: 0.9em;
  height: 1.1em;
  fill: ${color};
  position: absolute;
  top: -0.3em;
  left: -0.5em;
`

const relative = css`
  position: relative;
`

const borderLeftCss = (color: string) => css`
  border-left: 0.1em solid ${color};
`

const borderTopCss = (color: string) => css`
  border-top: 0.1em solid ${color};
`

const trophyIconCss = (color: string) => css`
  color: ${color};
`

const left = css`
  text-align: left;
`

const buttonsLine = css`
  display: flex;
  justify-content: space-between;
  margin: 0;
`
