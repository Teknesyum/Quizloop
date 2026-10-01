import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ shell: { trashItem: vi.fn() } }))

const { isFixedProbe } = await import('./source')

describe('isFixedProbe', () => {
  it('trusts an internal fixed disk', () => {
    expect(isFixedProbe('3|SCSI|Fixed hard disk media\r\n')).toBe(true)
    expect(isFixedProbe('3|IDE|Fixed hard disk media')).toBe(true)
  })
  it('keeps removable, usb and network drives', () => {
    expect(isFixedProbe('2|USB|Removable Media')).toBe(false)
    expect(isFixedProbe('3|USB|External hard disk media')).toBe(false)
    expect(isFixedProbe('3|SCSI|External hard disk media')).toBe(false)
    expect(isFixedProbe('4||')).toBe(false)
    expect(isFixedProbe('5||')).toBe(false)
  })
  it('keeps the file when the probe is empty', () => {
    expect(isFixedProbe('')).toBe(false)
    expect(isFixedProbe('3||')).toBe(false)
  })
})
