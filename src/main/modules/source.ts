import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { shell } from 'electron'

export type SourceFate = 'trashed' | 'kept'

const PROBE = `
$ErrorActionPreference = 'Stop'
$l = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$env:QL_DRIVE'"
$p = Get-CimInstance -Query "ASSOCIATORS OF {Win32_LogicalDisk.DeviceID='$env:QL_DRIVE'} WHERE AssocClass=Win32_LogicalDiskToPartition" | Select-Object -First 1
$d = Get-CimInstance -Query "ASSOCIATORS OF {Win32_DiskPartition.DeviceID='$($p.DeviceID)'} WHERE AssocClass=Win32_DiskDriveToDiskPartition" | Select-Object -First 1
"$($l.DriveType)|$($d.InterfaceType)|$($d.MediaType)"
`

export function isFixedProbe(out: string): boolean {
  const [type, iface, media] = out.trim().split('|')
  if (type !== '3') return false
  if (!iface || /usb|1394/i.test(iface)) return false
  if (/removable|external/i.test(media ?? '')) return false
  return true
}

function probeWindows(path: string): Promise<boolean> {
  const m = /^([a-z]):[\\/]/i.exec(path)
  if (!m) return Promise.resolve(false)
  return new Promise((ok) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', PROBE],
      {
        env: { ...process.env, QL_DRIVE: `${m[1]}:` },
        timeout: 15000,
        windowsHide: true
      },
      (err, out) => ok(!err && isFixedProbe(String(out)))
    )
  })
}

export async function onFixedDisk(path: string): Promise<boolean> {
  if (process.platform === 'win32') return probeWindows(path)
  if (process.platform === 'darwin') return !path.startsWith('/Volumes/')
  return !/^\/(media|run\/media|mnt)\//.test(path)
}

export async function consumePackage(picked: string): Promise<SourceFate> {
  const path = resolve(picked)
  if (!existsSync(path) || !(await onFixedDisk(path))) return 'kept'
  try {
    await shell.trashItem(path)
    return 'trashed'
  } catch {
    return 'kept'
  }
}
