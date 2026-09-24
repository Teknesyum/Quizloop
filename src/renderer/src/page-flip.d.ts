declare module 'page-flip' {
  export interface FlipEvent {
    data: unknown
  }
  export class PageFlip {
    constructor(root: HTMLElement, settings: Record<string, number | string | boolean>)
    loadFromHTML(items: HTMLElement[]): void
    on(name: string, cb: (e: FlipEvent) => void): this
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    turnToNextPage(): void
    turnToPrevPage(): void
    getCurrentPageIndex(): number
    getOrientation(): 'portrait' | 'landscape'
    destroy(): void
  }
}
