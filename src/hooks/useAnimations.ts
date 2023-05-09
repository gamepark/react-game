import { Animation, DisplayedAction, GamePageState, getAnimatedMove } from '@gamepark/react-client'
import { useSelector } from 'react-redux'

export function useAnimation<Move = any, PlayerId = any>(predicate?: (animation: Animation<Move, PlayerId>) => boolean): Animation<Move, PlayerId> | undefined {
  const action = useSelector((state: GamePageState<any, Move, PlayerId>) => {
    for (const action of state.actions ?? []) {
      if (action.animation) {
        if (!predicate || predicate(getAnimationFromState(action))) {
          return action
        }
      }
    }
  })
  return action ? getAnimationFromState(action) : undefined
}

export function getAnimationFromState(action: DisplayedAction): Animation {
  return {
    move: getAnimatedMove(action),
    duration: action.animation?.duration ?? 0,
    action
  }
}
export function useAnimations<Move = any, PlayerId = number>(predicate?: (animation: Animation<Move, PlayerId>) => boolean): Animation<Move, PlayerId>[] {
  const actions = useSelector((state: GamePageState<any, Move, PlayerId>) => state.actions || [])
  return actions.filter(action => action.animation !== undefined)
    .map<Animation<Move, PlayerId>>(getAnimationFromState)
    .filter(animation => !predicate || predicate(animation))
}