import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = process.argv[2]
if (target !== 'node' && target !== 'electron') {
  process.stderr.write('usage: node scripts/abi.mjs <node|electron>\n')
  process.exit(2)
}

const binding = resolve('node_modules/better-sqlite3/build/Release/better_sqlite3.node')
const cacheDir = resolve('node_modules/.cache/quizloop-abi')
const cached = resolve(cacheDir, `${target}.node`)
const stamp = resolve(cacheDir, 'current')

mkdirSync(cacheDir, { recursive: true })

function current() {
  return existsSync(stamp) ? readFileSync(stamp, 'utf8').trim() : ''
}

if (current() === target && existsSync(binding)) process.exit(0)

if (existsSync(binding) && current() && current() !== target) {
  copyFileSync(binding, resolve(cacheDir, `${current()}.node`))
}

if (existsSync(cached)) {
  copyFileSync(cached, binding)
} else if (target === 'node') {
  execSync('npm rebuild better-sqlite3', { stdio: 'inherit' })
  copyFileSync(binding, cached)
} else {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
  const version = String(pkg.devDependencies.electron).replace(/^[^\d]*/, '')
  execSync(`npm exec -- prebuild-install -r electron -t ${version}`, {
    cwd: resolve('node_modules/better-sqlite3'),
    stdio: 'inherit'
  })
  copyFileSync(binding, cached)
}

writeFileSync(stamp, target, 'utf8')
