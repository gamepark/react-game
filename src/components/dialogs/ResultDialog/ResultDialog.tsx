/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { GameMode, GamePageState, PLATFORM_URI, Player } from '@gamepark/react-client'
import { isCompetitive, rankPlayers } from '@gamepark/rules-api'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Dialog, DialogProps } from '../Dialog'
import { usePlayerName, usePlayers, useResultText, useRules } from '../../../hooks'
import { Avatar } from '../../Avatar'
import { RematchSection } from './RematchSection'
import { NavButton } from '../../menus/Menu/NavButton'
import { GamePoints } from '../../GamePoints'
import { Medal } from '../../menus'
import { gameContext } from '../../GameProvider'
import { faChessPawn } from '@fortawesome/free-solid-svg-icons'
import { RestartTutorialButton } from '../../menus/RestartTutorialButton'

type Props = DialogProps & {
  openDialog: () => void
  close: () => void
}

const query = new URLSearchParams(window.location.search)
const locale = query.get('locale') || 'en'
const gameId = query.get('game')

export const ResultDialog = ({ openDialog, close, ...props }: Props) => {
  const { t } = useTranslation()
  const players = [...usePlayers()]
  const context = useContext(gameContext)
  const rules = useRules()!
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const tournament = useSelector((state: GamePageState) => state.tournament)
  const ranks = players.map(_ => 1)
  if (isCompetitive(rules) && players.length > 1) {
    players.sort((playerA, playerB) => {
      if (playerA.quit || playerB.quit) {
        return playerA.quit ? playerB.quit ? 0 : 1 : -1
      }
      return rankPlayers(rules, playerA.id, playerB.id)
    })
    for (let i = 1; i < players.length; i++) {
      if (players[i - 1].quit) {
        ranks[i] = ranks[i - 1]
      } else if (players[i].quit) {
        ranks[i] = ranks[i - 1] + 1
      } else {
        ranks[i] = rankPlayers(rules, players[i - 1].id, players[i].id) === 0 ? ranks[i - 1] : ranks[i - 1] + 1
      }
    }
  }
  const rows = gameMode === GameMode.TOURNAMENT ? 3 : gameMode === GameMode.COMPETITIVE ? 2 : 1
  const resultText = useResultText()
  return (
    <Dialog onBackdropClick={close} css={style} {...props}>
      <FontAwesomeIcon icon={faXmark} css={closeIcon} onClick={close}/>
      <h2>{resultText}</h2>
      {gameMode === GameMode.TOURNAMENT && tournament &&
        <NavButton css={autoMargin} url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/tournaments/${tournament.number}`}>
          {t('result.tournament.link')}
        </NavButton>
      }
      {gameMode === GameMode.COMPETITIVE &&
        <NavButton css={autoMargin} url={`${PLATFORM_URI}/${locale}/board-games/${context.game}/play?mode=matchmaking`}>
          {t('Play again')}
        </NavButton>
      }
      <div css={[gridCss, rows > 1 ? multiRows(players.length, rows) : singleRow(players.length)]}>
        {rows > 1 && <div/>}
        {gameMode === GameMode.TOURNAMENT && <div css={borderTop}>{t('Tournament')}</div>}
        {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) && <div css={borderTop}>{t('Ranking')}</div>}
        {players.map((player, index) =>
          <PlayerDisplay key={index} player={player} gameMode={gameMode}
                         rank={isCompetitive(rules) && ranks[index] <= 3 ? ranks[index] : undefined} border={rows > 1}/>)
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

const PlayerDisplay = ({ gameMode, player, rank, border }: { gameMode?: GameMode, player: Player, rank?: number, border: boolean }) => {
  const playerName = usePlayerName(player.id)
  return <>
    <div css={[relative, border && borderLeft]}>
      <div css={avatarContainer}>
        <Avatar playerId={player.id} css={avatarCss}/>
        {rank !== undefined && <Medal rank={rank} css={medalCss}/>}
      </div>
      <span>{playerName}</span>
    </div>
    {gameMode === GameMode.TOURNAMENT &&
      <div css={[borderLeft, borderTop]}>
        {!!player.tournamentPoints && <><FontAwesomeIcon icon={faTrophy} css={trophyIcon}/><span>+{player.tournamentPoints}</span></>}
      </div>
    }
    {(gameMode === GameMode.TOURNAMENT || gameMode === GameMode.COMPETITIVE) &&
      <div css={[borderLeft, borderTop]}>
        <GamePoints playerId={player.id}/>
      </div>
    }
  </>
}

const style = css`
  font-size: 3.2em;
  text-align: center;

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

const autoMargin = css`
  margin-left: auto;
  margin-right: auto;
`

const gridCss = css`
  display: grid;
  grid-auto-flow: column;

  > div {
    padding: 1em;
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
  border-left: 0.2em solid #28b8ce;
`

const borderTop = css`
  border-top: 0.2em solid #28b8ce;
`

const trophyIcon = css`
  color: #28b8ce;
`

const buttonsLine = css`
  display: flex;
  justify-content: space-between;
  margin: 0;
`