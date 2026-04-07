import { createContext, useContext, useEffect, useRef, useState } from 'react'

type ObserverCallback = (isIntersecting: boolean) => void

export type SharedObserver = {
  observe: (el: HTMLElement, callback: ObserverCallback) => void
  unobserve: (el: HTMLElement) => void
}

export const SharedIntersectionContext = createContext<SharedObserver | null>(null)

export const useSharedObserver = (root: HTMLElement | null): SharedObserver | null => {
  const callbacksRef = useRef(new Map<Element, ObserverCallback>())
  const [observer, setObserver] = useState<SharedObserver | null>(null)

  useEffect(() => {
    if (!root) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacksRef.current.get(entry.target)
          if (cb) cb(entry.isIntersecting)
        }
      },
      { root, rootMargin: '300px 0px' }
    )

    const shared: SharedObserver = {
      observe: (el, callback) => {
        callbacksRef.current.set(el, callback)
        io.observe(el)
      },
      unobserve: (el) => {
        callbacksRef.current.delete(el)
        io.unobserve(el)
      }
    }

    setObserver(shared)

    return () => {
      io.disconnect()
      callbacksRef.current.clear()
      setObserver(null)
    }
  }, [root])

  return observer
}

export const useSharedIntersection = () => useContext(SharedIntersectionContext)
