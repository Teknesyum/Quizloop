import { useState } from 'react'

export type View = 'card' | 'list'

const STORE = 'ql-gorunum'

function readView(): View {
  try {
    return localStorage.getItem(STORE) === 'card' ? 'card' : 'list'
  } catch {
    return 'list'
  }
}

export function useView(): [View, (v: View) => void] {
  const [view, setView] = useState<View>(readView)
  const set = (v: View): void => {
    setView(v)
    try {
      localStorage.setItem(STORE, v)
    } catch {
      return
    }
  }
  return [view, set]
}
