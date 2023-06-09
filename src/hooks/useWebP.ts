import { useEffect, useState } from 'react'
import webPCheck from 'supports-webp'

export const useWebP = (): boolean | undefined => {
  const [webP, setWebP] = useState<boolean>()

  useEffect(() => {
    (async () => {
      const webP = await webPCheck
      setWebP(webP)
    })()
  }, [webPCheck, setWebP])

  return webP
}
