/** @jsxImportSource @emotion/react */
import { ButtonHTMLAttributes, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { PlayOptions, useUndo } from '../../../hooks'
import { ThemeButton } from '../ThemeButton'
import { useIsAnimatingPlayerAction } from '../../material/utils/useIsAnimatingPlayerAction'

export type UndoMovesButtonProps = {
  moves?: number
} & PlayOptions & ButtonHTMLAttributes<HTMLButtonElement>

export const UndoMovesButton: FC<UndoMovesButtonProps> = (props) => {
  const { moves = 1, ...rest } = props
  const [undo, canUndo] = useUndo()
  const [displayedLongEnough, setDisplayedLongEnough] = useState(false)
  const isAnimatingPlayerAction = useIsAnimatingPlayerAction()
  const disabled = useMemo(() => isAnimatingPlayerAction || !canUndo(), [isAnimatingPlayerAction, canUndo])
  useEffect(() => {
    if (disabled) {
      setDisplayedLongEnough(false)
    } else {
      const timeout = setTimeout(() => setDisplayedLongEnough(true), 200)
      return () => clearTimeout(timeout)
    }
  }, [disabled])

  const doUndo = useCallback(() => {
    undo(moves)
  }, [undo, moves])

  const onClick = useCallback(() => {
    if (displayedLongEnough) {
      doUndo()
    }
  }, [doUndo, displayedLongEnough])

  return <ThemeButton key="button" onClick={onClick} disabled={disabled} {...rest}/>
}
