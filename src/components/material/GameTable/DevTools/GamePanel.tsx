/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { toolListCss } from './devtools.css'
import { GameOption } from './DevToolsHub'
import { NewGameTool } from './NewGameTool'
import { ReplayTool } from './ReplayTool'
import { UndoTool } from './UndoTool'
import { SwitchPlayerTool } from './SwitchPlayerTool'
import { BotTool } from './BotTool'
import { AnimationSpeedTool } from './AnimationSpeedTool'
import { TutorialTool } from './TutorialTool'

type GamePanelProps = {
  exec: (action: () => void, msg: string) => void
  g: any
  gameOptions?: GameOption[]
}

export const GamePanel: FC<GamePanelProps> = ({ exec, g, gameOptions }) => (
  <div css={toolListCss}>
    <NewGameTool exec={exec} g={g} gameOptions={gameOptions} />
    <ReplayTool exec={exec} />
    <UndoTool exec={exec} g={g} />
    <SwitchPlayerTool exec={exec} g={g} />
    <BotTool exec={exec} g={g} />
    <AnimationSpeedTool exec={exec} g={g} />
    <TutorialTool exec={exec} g={g} />
  </div>
)
