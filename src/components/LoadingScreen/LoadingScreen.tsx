/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { faLaptopCode, faLightbulb, faPaintBrush, faWrench } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Picture } from '../Picture'

export type LoadingScreenProps = {
  gameBox?: string
  author?: string | string[]
  artist?: string | string[]
  publisher?: string | string[]
  developer?: string | string[]
  display: boolean
} & HTMLAttributes<HTMLDivElement>

export const LoadingScreen = ({
                                gameBox = process.env.PUBLIC_URL + '/box-640.png',
                                author,
                                artist,
                                publisher,
                                developer,
                                display,
                                ...props
                              }: LoadingScreenProps) => {
  const { t } = useTranslation()
  const [includeInLayout, setIncludeInLayout] = useState(display)
  useEffect(() => {
    if (display) {
      setIncludeInLayout(true)
    } else {
      const timeout = setTimeout(() => setIncludeInLayout(false), fadeOutDuration)
      return () => clearTimeout(timeout)
    }
  }, [display])
  if (!includeInLayout) return null
  const authors = typeof author === 'string' ? [author] : author ?? []
  const artists = typeof artist === 'string' ? [artist] : artist ?? []
  const publishers = typeof publisher === 'string' ? [publisher] : publisher ?? []
  const developers = typeof developer === 'string' ? [developer] : developer ?? []
  return (
    <div css={[loadingScreenStyle, !display && hiddenStyle]} {...props}>
      {gameBox && <Picture css={gameBoxStyle} src={gameBox} alt={t('Name')!}/>}
      <h2 css={gameTitle}>{t('Name')}</h2>
      <p css={gamePeople}>
        <FontAwesomeIcon css={iconStyle} icon={faLightbulb}/>
        {authors.length === 1 &&
          <Trans defaults="authors.1" values={{ author }} components={[<strong/>]}/>
        }
        {authors.length === 2 &&
          <Trans defaults="authors.2" values={{ author1: authors[0], author2: authors[1] }} components={[<strong/>]}/>
        }
        <br/>
        <FontAwesomeIcon css={iconStyle} icon={faPaintBrush}/>
        {artists.length === 1 &&
          <Trans defaults="artists.1" values={{ artist }} components={[<strong/>]}/>
        }
        {artists.length === 2 &&
          <Trans defaults="artists.2" values={{ artist1: artists[0], artist2: artists[1] }} components={[<strong/>]}/>
        }
        <br/>
        <FontAwesomeIcon css={iconStyle} icon={faWrench}/>
        {publishers.length === 1 &&
          <Trans defaults="publishers.1" values={{ publisher }} components={[<strong/>]}/>
        }
        {publishers.length === 2 &&
          <Trans defaults="publishers.2" values={{ publisher1: publishers[0], publisher2: publishers[1] }}
                 components={[<strong/>]}/>
        }
        <br/>
        <FontAwesomeIcon css={iconStyle} icon={faLaptopCode}/>
        {developers.length === 1 &&
          <Trans defaults="developers.1" values={{ developer }} components={[<strong/>]}/>
        }
        {developers.length === 2 &&
          <Trans defaults="developers.2" values={{ developer1: developers[0], developer2: developers[1] }}
                 components={[<strong/>]}/>
        }
      </p>
    </div>
  )
}

const fadeOutDuration = 2000

const loadingScreenStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity ${fadeOutDuration}ms;
  background-size: cover;
  background-position: center;

  &:before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  > * {
    z-index: 1;
  }
`

const gameBoxStyle = css`
  position: relative;
  width: 62em;
  height: 66em;
  margin-top: 7em;
  margin-bottom: 2em;
  filter: drop-shadow(1px 0 white) drop-shadow(0 1px white) drop-shadow(-1px 0 white) drop-shadow(0 -1px white);
`

const gameTitle = css`
  font-size: 5em;
  margin: 0;
`

const gamePeople = css`
  font-size: 3em;
`

const iconStyle = css`
  min-width: 6em;
  position: relative;
`

const hiddenStyle = css`
  opacity: 0;
`