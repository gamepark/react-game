/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { GameOption } from './DevToolsHub'
import { NewGameTool } from './NewGameTool'
import { UndoTool } from './UndoTool'
import { SwitchPlayerTool } from './SwitchPlayerTool'
import { BotTool } from './BotTool'
import { TutorialTool } from './TutorialTool'

type GamePanelProps = {
  exec: (action: () => void, msg: string) => void
  g: any
  gameOptions?: GameOption[]
}

export const GamePanel: FC<GamePanelProps> = ({ exec, g, gameOptions }) => (
  <>
    <NewGameTool exec={exec} g={g} gameOptions={gameOptions} />
    <UndoTool exec={exec} g={g} />
    <SwitchPlayerTool exec={exec} g={g} />
    <BotTool exec={exec} g={g} />
    <TutorialTool exec={exec} g={g} />
  </>
)
