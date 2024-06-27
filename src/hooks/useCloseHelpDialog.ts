import { LocalMoveType, MaterialMove, MoveKind } from '../../../rules-api'
import { useActions } from './useActions'
import { useUndo } from './useUndo'

export const useCloseHelpDialog = () => {
  const actions = useActions<MaterialMove>()
  const [undo] = useUndo()
  return () => {
    for (const action of actions ?? []) {
      if (action.move.kind === MoveKind.LocalMove && action.move.type === LocalMoveType.DisplayHelp) {
        undo(action.id)
      }
    }
  }
}
