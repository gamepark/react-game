/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faChessPawn } from '@fortawesome/free-solid-svg-icons/faChessPawn'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, GamePageState, PLATFORM_URI, ScoringDescription } from '@gamepark/react-client'
import { isCompetitive } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
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
  const { t } = useTranslation()
  const rankedPlayers = useRankedPlayers()
  const context = useContext(gameContext)
  const rules = useRules()!
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const tournament = useSelector((state: GamePageState) => state.tournament)
  const scoringCells = useScoringHeader()
  let row = (gameMode === GameMode.TOURNAMENT ? 3 : gameMode === GameMode.COMPETITIVE ? 2 : 1) + (scoringCells?.length ?? 0)

  const resultText = useResultText()
  return (
    <Dialog onBackdropClick={close} css={style} {...props}>
      <FontAwesomeIcon icon={faXmark} css={closeIcon} onClick={close}/>
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
        {row > 1 && <div/>}
        {gameMode === GameMode.TOURNAMENT && <div css={[borderTop, left]}>{t('Tournament')}</div>}
        {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) && <div css={[borderTop, left]}>{t('Ranking')}</div>}
        {scoringCells.map((cell, index) => (
          <div css={[borderTop, left]} key={index}>
            {cell}
          </div>
        ))}
        {rankedPlayers.map((player, index) =>
          <PlayerDisplay key={index}
                         playerId={player.id}
                         gameMode={gameMode}
                         rank={isCompetitive(rules) && player.rank <= 3 ? player.rank : undefined}
                         border={row > 1}
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
    </Dialog>
  )
}

const PlayerDisplay = ({ gameMode, playerId, rank, border }: {
  gameMode?: GameMode,
  playerId: any,
  rank?: number,
  border: boolean
}) => {
  const playerName = usePlayerName(playerId)
  const tournamentPoints = useSelector((state: GamePageState) => state.players.find(p => p.id === playerId)?.tournamentPoints ?? undefined)
  const playerData = usePlayerScoring(playerId)
  return <>
    <div css={[relative, border && borderLeft]}>
      <div css={avatarContainer}>
        <Avatar playerId={playerId} css={avatarCss}/>
        {rank !== undefined && <Medal rank={rank} css={medalCss}/>}
      </div>
      <span>{playerName}</span>
    </div>
    {gameMode === GameMode.TOURNAMENT &&
      <div css={[borderLeft, borderTop]}>
        {tournamentPoints !== undefined && <><FontAwesomeIcon icon={faTrophy} css={trophyIcon}/><span>+{tournamentPoints}</span></>}
      </div>
    }
    {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) &&
      <div css={[borderLeft, borderTop]}>
        <GamePoints playerId={playerId}/>
      </div>
    }
    {playerData.map((cell, index) => (
      <div css={[borderLeft, borderTop]} key={index}>
        {cell}
      </div>
    ))}
  </>
}

const style = css`
  font-size: 3.2em;
  text-align: center;
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;


  > h2 {
    margin: 0 1em 0.5em;
  }
`

const closeIcon = css`
  position: absolute;
  right: 0.8em;
  top: 0.6em;
  font-size: 1.3em;
  cursor: pointer;
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
    padding: 0.7em;
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
  width: 3em;
  height: 3em;
  margin: auto auto 0.5em;
`

const avatarCss = css`
  position: relative;
  width: 3em;
  height: 3em;
`

const medalCss = css`
  width: 1.3em;
  height: 1.6em;
  fill: #002448;
  position: absolute;
  top: -0.5em;
  left: -0.8em;
`

const relative = css`
  position: relative;
`

const borderLeft = css`
  border-left: 0.1em solid #28b8ce;
`

const borderTop = css`
  border-top: 0.1em solid #28b8ce;
`

const trophyIcon = css`
  color: #28b8ce;
`

const left = css`
  text-align: left;
`

const buttonsLine = css`
  display: flex;
  justify-content: space-between;
  margin: 0;
`