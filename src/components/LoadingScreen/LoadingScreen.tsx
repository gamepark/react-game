import { css, Theme } from '@emotion/react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faImage } from '@fortawesome/free-solid-svg-icons/faImage'
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons/faLaptopCode'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons/faLightbulb'
import { faPaintbrush } from '@fortawesome/free-solid-svg-icons/faPaintbrush'
import { faWrench } from '@fortawesome/free-solid-svg-icons/faWrench'
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic'
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
  musician?: string | string[]
  display: boolean
} & HTMLAttributes<HTMLDivElement>

export const LoadingScreen = ({
                                gameBox = '/box-640.png',
                                author,
                                artist,
                                graphicDesigner,
                                publisher,
                                developer,
                                musician,
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
  const musicians = typeof musician === 'string' ? [musician] : musician ?? []
  return (
    <div css={[loadingScreenStyle, !display && hiddenStyle]} {...props}>
      {gameBox && <Picture css={gameBoxStyle} src={gameBox} alt={t('Name')!}/>}
      <h2 css={gameTitle}>{t('Name')}</h2>
      <p css={gamePeople}>
        <PeopleLine type="authors" people={authors} icon={faLightbulb}/>
        <PeopleLine type="artists" people={artists} icon={faPaintbrush}/>
        <PeopleLine type="graphics" people={graphicDesigners} icon={faImage}/>
        <PeopleLine type="publishers" people={publishers} icon={faWrench}/>
        <PeopleLine type="developers" people={developers} icon={faLaptopCode}/>
        <PeopleLine type="musician" people={musicians} icon={faMusic}/>
      </p>
    </div>
  )
}

const PeopleLine = ({type, icon, people}: {type: string, icon: IconProp, people: string[]}) => {
  if (!people.length) return null
  return <>
    <FontAwesomeIcon css={iconStyle} icon={icon}/>
    {people.length === 1 &&
      <Trans defaults={`${type}.1`} values={{ name: people[0] }} components={[<strong/>]}/>
    }
    {people.length === 2 &&
      <Trans defaults={`${type}.2`} values={{ name1: people[0], name2: people[1] }}
             components={[<strong/>]}/>
    }
    <br/>
  </>
}

const fadeOutDuration = 2000

const loadingScreenStyle = (theme: Theme) => css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  font-size: 1vh;
  font-size: 1dvh;
  @media (max-aspect-ratio: 1) {
    font-size: 1vw;
    font-size: 1dvw;
  }
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
