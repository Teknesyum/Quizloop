import { useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/ipc'

export function useUpdate(): UpdateStatus {
  const [s, setS] = useState<UpdateStatus>({ state: 'idle' })
  useEffect(() => {
    window.quizloop.update.status().then(setS)
    return window.quizloop.update.onStatus(setS)
  }, [])
  return s
}
