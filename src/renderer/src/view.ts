import { useState } from 'react'

export type View = 'card' | 'list'

const STORE = 'ql-view'

function readView(): View {
  try {
    return localStorage.getItem(STORE) === 'list' ? 'list' : 'card'
  } catch {
    return 'card'
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
