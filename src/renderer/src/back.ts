type Handler = () => boolean

const stack: Handler[] = []

export function pushBack(h: Handler): () => void {
  stack.push(h)
  return () => {
    const i = stack.lastIndexOf(h)
    if (i >= 0) stack.splice(i, 1)
  }
}

export function runBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i]?.()) return true
  return false
}
