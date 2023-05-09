/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gameContext, GameMode, GamePageState, GamePoints, NavButton, PLATFORM_URI, RematchSection, usePlayerId, usePlayers } from '@gamepark/react-client'
import { getFallbackPlayerName, isCompetitive } from '@gamepark/rules-api'
import { Fragment, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Dialog, dialogDefaultCss, DialogProps } from './Dialog'
import { useGame } from '../../hooks'
import Medal from '../menus/Result/Medal'
import { Avatar } from '../Avatar'

type Props = DialogProps & {
  openDialog: () => void
  close: () => void
}

export function ResultDialog({ openDialog, close, ...props }: Props) {
  const { t } = useTranslation()
  const playerId = usePlayerId()
  const players = [...usePlayers()]
  const context = useContext(gameContext)
  const game = useGame()
  const gameMode = useSelector((state: GamePageState) => state.gameMode)
  const tournament = useSelector((state: GamePageState) => state.tournament)
  const query = new URLSearchParams(window.location.search)
  const locale = query.get('locale') || 'en'
  const rules = new context.Rules(game)
  const ranks = players.map(_ => 1)
  if (isCompetitive(rules) && players.length > 1) {
    players.sort((playerA, playerB) => rules.rankPlayers(playerA.id, playerB.id))
    for (let i = 1; i < players.length; i++) {
      ranks[i] = rules.rankPlayers(players[i - 1].id, players[i].id) === 0 ? ranks[i - 1] : i + 1
    }
  }
  const rows = gameMode === GameMode.TOURNAMENT ? 3 : gameMode === GameMode.COMPETITIVE ? 2 : 1
  return (
    <Dialog onBackdropClick={close} css={style} {...props}>
      <FontAwesomeIcon icon={faXmark} css={closeIcon} onClick={close}/>
      {isCompetitive(rules) && players.length > 1 ?
        rules.rankPlayers(players[0].id, players[1].id) === 0 ? <h2>{t('result.equality')}</h2> :
          players[0].id === playerId ? <h2>{t('result.victory')}</h2> :
            <h2>{t('result.victory.other', { player: players[0].name ?? getFallbackPlayerName(players[0].id, t, context.optionsSpec) })}</h2> :
        <h2>{t('result.over')}</h2>
      }
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
        {players.map((player, index) => <Fragment key={index}>
          <div key={index} css={[relative, rows > 1 && borderLeft]}>
            <div css={avatarContainer}>
              <Avatar playerId={player.id} css={avatarCss}/>
              {isCompetitive(rules) && ranks[index] <= 3 && <Medal rank={ranks[index]} css={medalCss}/>}
            </div>
            <span>{player.name ?? getFallbackPlayerName(player.id, t, context.optionsSpec)}</span>
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
        </Fragment>)}
      </div>
      <RematchSection openDialog={openDialog}/>
    </Dialog>
  )
}

const style = css`
  ${dialogDefaultCss};
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