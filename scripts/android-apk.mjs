import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const android = join(root, 'android')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const release = process.argv.includes('--release')
const kind = release ? 'release' : 'debug'

function findSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk')
  ]
  return candidates.find((p) => p && existsSync(join(p, 'platforms')))
}

const sdk = findSdk()
if (!sdk) {
  console.error('Android SDK not found: set ANDROID_HOME')
  process.exit(2)
}
const props = join(android, 'local.properties')
if (!existsSync(props)) writeFileSync(props, `sdk.dir=${sdk.replaceAll('\\', '/')}\n`)

const scratch = join(root, 'tmp', 'gradle')
mkdirSync(scratch, { recursive: true })
const slash = scratch.replaceAll('\\', '/')
const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  TEMP: scratch,
  TMP: scratch,
  JAVA_TOOL_OPTIONS: `-Djdk.net.unixdomain.tmpdir=${slash} -Djava.io.tmpdir=${slash}`
}
if (!env.JAVA_HOME) {
  console.error('JAVA_HOME is not set: point it at JDK 21')
  process.exit(2)
}

const win = process.platform === 'win32'
const task = release ? 'assembleRelease' : 'assembleDebug'
const r = spawnSync(join(android, win ? 'gradlew.bat' : 'gradlew'), [task, '--console=plain'], {
  cwd: android,
  env,
  stdio: 'inherit',
  shell: win
})
if (r.status !== 0) process.exit(r.status ?? 1)

const built = join(android, 'app', 'build', 'outputs', 'apk', kind, `app-${kind}.apk`)
const outDir = join(root, 'dist-android')
mkdirSync(outDir, { recursive: true })
const target = join(outDir, `QuizLoop-${version}-${kind}.apk`)
copyFileSync(built, target)
console.log(`${target} ${(statSync(target).size / 1048576).toFixed(1)} MB`)
