/** @jsxImportSource @emotion/react */
import { css, keyframes, Theme, useTheme } from '@emotion/react'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { closeHelpDisplay, displayMaterialHelp, isSameLocationArea, MaterialHelpDisplay, MaterialItem, MaterialRules } from '@gamepark/rules-api'
import { FC, useMemo } from 'react'
import { fontSizeCss, transformCss } from '../../../css'
import { useKeyDown, useMaterialContext, useMaterialDescription, usePlay, useRules } from '../../../hooks'
import { ItemContext } from '../../../locators'
import { isFlatMaterialDescription, MaterialComponent } from '../../material'
import { LocationDisplay } from '../../material/locations/LocationDisplay'
import { helpDialogContentCss } from './RulesHelpDialogContent'

export type MaterialRulesDialogContentProps<Player extends number = number, MaterialType extends number = number, LocationType extends number = number> = {
  helpDisplay: MaterialHelpDisplay<Player, MaterialType, LocationType>
}


const useMaterialNavigation = (helpDisplay: MaterialHelpDisplay) => {
  const rules = useRules<MaterialRules>()!
  const play = usePlay()
  const helpItem = helpDisplay.item
  const material = useMemo(() => helpItem.location && rules
      .material(helpDisplay.itemType)
      .location((location) => isSameLocationArea(location, helpItem.location!))
      .sort(
        (item) => item.location.x ?? 0,
        (item) => item.location.y ?? 0,
        (item) => item.location.z ?? 0
      ),
    [rules.game])

  useKeyDown('ArrowRight', () => nextMove ? play(nextMove, { local: true }) : undefined)
  useKeyDown('ArrowLeft', () => previousMove ? play(previousMove, { local: true }) : undefined)

  const materialIndexes = useMemo(() => material?.getIndexes(), [material])

  if (!material || !materialIndexes) return { previous: undefined, next: undefined }

  const currentIndex = materialIndexes.indexOf(helpDisplay.itemIndex!)
  const previous = material.index(materialIndexes[currentIndex - 1])
  const next = material.index(materialIndexes[currentIndex + 1])
  const previousMove = previous.length ? displayMaterialHelp(helpDisplay.itemType, previous.getItem(), previous.getIndex()) : undefined
  const nextMove = next.length ? displayMaterialHelp(helpDisplay.itemType, next.getItem(), next.getIndex()) : undefined

  return {
    previous: previous.length ? displayMaterialHelp(helpDisplay.itemType, previous.getItem(), previous.getIndex()) : undefined,
    next: next.length ? displayMaterialHelp(helpDisplay.itemType, next.getItem(), next.getIndex()) : undefined
  }

}

export const MaterialRulesDialogContent = <P extends number = number, M extends number = number, L extends number = number>(
  { helpDisplay }: MaterialRulesDialogContentProps<P, M, L>
) => {
  const play = usePlay()
  const context = useMaterialContext<P, M, L>()
  const description = useMaterialDescription<P, M, L>(helpDisplay.itemType)
  const { previous, next } = useMaterialNavigation(helpDisplay)
  if (!description) return null
  const item = helpDisplay.item
  const { width, height } = description.getSize(item.id)
  const itemContext: ItemContext<P, M, L> = { ...context, type: helpDisplay.itemType, index: helpDisplay.itemIndex!, displayIndex: helpDisplay.displayIndex! }
  const hasNavigation = previous || next
  const locations = item.location ? context.material[helpDisplay.itemType]?.getLocations(item as MaterialItem<P, L, any>, itemContext) ?? [] : []
  return <>
    <div css={[flex, hasNavigation && fullSize]}>
      <MaterialComponent type={helpDisplay.itemType} itemId={item.id} css={[
        noShrink, fontSizeCss(Math.min(75 / height, 75 / width, 10)),
        isFlatMaterialDescription(description) && description.isFlipped(item, itemContext) && transformCss('rotateY(180deg)')
      ]}>
        {locations.map((location) => <LocationDisplay key={JSON.stringify(location)} location={location}/>)}
      </MaterialComponent>
      <div css={helpDialogContentCss}>
        {description.help && <description.help {...helpDisplay} closeDialog={() => play(closeHelpDisplay, { local: true })}/>}
      </div>
    </div>
    {previous && <PreviousArrow onPrevious={() => play(previous, { local: true })}/>}
    {next && <NextArrow onNext={() => play(next, { local: true })}/>}
  </>
}


type NextArrowProps = {
  onNext: () => void
}
const NextArrow: FC<NextArrowProps> = (props) => {
  const { onNext } = props
  const theme = useTheme()
  return (
    <div tabIndex={2} css={[navigationArrow(theme), nextArrow]} onClick={onNext}>
      <FontAwesomeIcon icon={faChevronRight}/>
    </div>
  )
}

type PreviousArrowProps = {
  onPrevious: () => void
}
const PreviousArrow: FC<PreviousArrowProps> = (props) => {
  const { onPrevious } = props
  const theme = useTheme()
  return (
    <div tabIndex={1} css={[navigationArrow(theme), previousArrow]} onClick={onPrevious}>
      <FontAwesomeIcon icon={faChevronLeft}/>
    </div>
  )
}

const navigationArrow = (theme: Theme) => css`
  position: absolute;
  top: 50%;
  z-index: -1;
  transform: translateY(-50%);
  background-color: ${theme.dialog.backgroundColor};
  color: ${theme.dialog.color};
  font-size: 4em;
  display: flex;
  align-items: center;
  border-radius: 1.4em;
  justify-content: center;
  box-shadow: 0 0 0.2em black;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`

const previousAnimation = keyframes`
  70% {
    left: -2.4em
  }
  100% {
    left: -1.7em;
  }
`

const previousArrow = css`
  padding: 0.7em 3em 0.7em 0.7em;
  left: -1.7em;

  &:focus:not(:active) {
    animation: ${previousAnimation} 0.2s forwards;
  }
`
const nextAnimation = keyframes`
  70% {
    right: -2.4em
  }
  100% {
    right: -1.7em;
  }
`

const nextArrow = css`
  padding: 0.7em 0.7em 0.7em 3em;
  right: -1.7em;

  &:focus:not(:active) {
    animation: ${nextAnimation} 0.2s forwards;
  }
`

const flex = css`
  display: flex;
  padding: 3em 1em 3em 3em;
  max-width: inherit;
  max-height: inherit;
`

const noShrink = css`
  flex-shrink: 0;
`

const fullSize = css`
  width: 80dvw
`
