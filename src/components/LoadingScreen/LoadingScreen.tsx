/** @jsxImportSource @emotion/react */
import { css, Theme } from '@emotion/react'
import { faImage } from '@fortawesome/free-solid-svg-icons/faImage'
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons/faLaptopCode'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons/faLightbulb'
import { faPaintbrush } from '@fortawesome/free-solid-svg-icons/faPaintbrush'
import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BackgroundTheme } from '../../css'
import { Picture } from '../Picture'

export type LoadingScreenProps = {
  gameBox?: string
  author?: string | string[]
  artist?: string | string[]
  graphicDesigner?: string | string[]
  publisher?: string | string[]
  developer?: string | string[]
  display: boolean
} & HTMLAttributes<HTMLDivElement>

export const LoadingScreen = ({
                                gameBox = process.env.PUBLIC_URL + '/box-640.png',
                                author,
                                artist,
                                graphicDesigner,
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
  const graphicDesigners = typeof graphicDesigner === 'string' ? [graphicDesigner] : graphicDesigner ?? []
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
        <FontAwesomeIcon css={iconStyle} icon={faPaintbrush}/>
        {artists.length === 1 &&
          <Trans defaults="artists.1" values={{ artist }} components={[<strong/>]}/>
        }
        {artists.length === 2 &&
          <Trans defaults="artists.2" values={{ artist1: artists[0], artist2: artists[1] }} components={[<strong/>]}/>
        }
        <br/>
        {graphicDesigners.length > 0 && <>
          <FontAwesomeIcon css={iconStyle} icon={faImage}/>
          {graphicDesigners.length === 1 &&
            <Trans defaults="graphics.1" values={{ name: graphicDesigners[0] }} components={[<strong/>]}/>
          }
          <br/>
        </>}
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

const loadingScreenStyle = (theme: Theme) => css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity ${fadeOutDuration}ms;
  pointer-events: none;
  ${backgroundCss(theme.root.background)};
  z-index: 1500;

  > * {
    z-index: 1;
  }
`

const gameBoxStyle = css`
  position: relative;
  width: 62em;
  height: 62em;
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

const backgroundCss = ({ image, overlay }: BackgroundTheme) => overlay ?
  css`
    background: linear-gradient(${overlay}, ${overlay}), url(${image}) center / cover, black;
  ` :
  css`
    background: url(${image}) center / cover, black;
  `
