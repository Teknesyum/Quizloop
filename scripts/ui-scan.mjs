import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const base = join(homedir(), '.claude', 'plugins', 'cache', 'teknesyum', 'teknesyum-ui')
if (!existsSync(base)) {
  console.error(`teknesyum-ui is not installed: ${base}`)
  process.exit(2)
}
const num = (v) => v.split('.').map((n) => Number.parseInt(n, 10) || 0)
const newest = readdirSync(base)
  .filter((v) => existsSync(join(base, v, 'scripts', 'scan.js')))
  .sort((a, b) => {
    const x = num(a)
    const y = num(b)
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] ?? 0) - (y[i] ?? 0)
    return 0
  })
  .pop()
if (!newest) {
  console.error(`no scan.js under ${base}`)
  process.exit(2)
}
const r = spawnSync(process.execPath, [join(base, newest, 'scripts', 'scan.js'), '.', ...process.argv.slice(2)], {
  stdio: 'inherit'
})
process.exit(r.status ?? 3)
