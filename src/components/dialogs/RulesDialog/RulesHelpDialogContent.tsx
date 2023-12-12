/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { closeHelpDisplay, RulesHelpDisplay } from '@gamepark/rules-api'
import { useContext } from 'react'
import { usePlay } from '../../../hooks'
import { gameContext } from '../../GameProvider'

export type RulesHelpDialogContentProps = {
  helpDisplay: RulesHelpDisplay
}

export const RulesHelpDialogContent = (
  { helpDisplay }: RulesHelpDialogContentProps
) => {
  const play = usePlay()
  const context = useContext(gameContext)
  const RulesHelp = context.rulesHelp?.[helpDisplay.ruleId]
  return <div css={helpDialogCss}>
    <div css={helpDialogContentCss}>
      {RulesHelp ?
        <RulesHelp close={() => play(closeHelpDisplay, { local: true })}/>
        : <>
          <h2>Missing help</h2>
          <p>Please provide some text to explain rule #{helpDisplay.ruleId}</p>
        </>
      }
    </div>
  </div>
}

const helpDialogCss = css`
  display: flex;
  padding: 3em;
  max-width: inherit;
  max-height: inherit;
`

export const helpDialogContentCss = css`
  margin: 0 0.5em;
  padding: 0 0.5em;
  font-size: 3em;
  overflow: auto;
  flex: 1;

  > h2 {
    margin: 0 1em;
    text-align: center;
  }

  > p {
    white-space: break-spaces;
  }
`
