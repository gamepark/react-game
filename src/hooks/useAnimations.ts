import { Animation, DisplayedAction, getAnimatedMove, useGameSelector } from '@gamepark/react-client'

export const useAnimation = <Move = any, PlayerId = any>(
  predicate?: (animation: Animation<Move, PlayerId>) => boolean
): Animation<Move, PlayerId> | undefined => {
  const action = useGameSelector((state) => {
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

export const getAnimationFromState = (action: DisplayedAction): Animation => ({
  move: getAnimatedMove(action),
  duration: action.animation?.duration ?? 0,
  action
})

export const useAnimations = <Move = any, PlayerId = number>(predicate?: (animation: Animation<Move, PlayerId>) => boolean): Animation<Move, PlayerId>[] => {
  const actions = useGameSelector((state) => state.actions) ?? []
  return actions.filter(action => action.animation !== undefined)
    .map<Animation<Move, PlayerId>>(getAnimationFromState)
    .filter(animation => !predicate || predicate(animation))
}