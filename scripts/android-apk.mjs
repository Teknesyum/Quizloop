import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

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

function hidden(question) {
  return new Promise((ok) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) rl.output.write(question)
    }
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write(String.fromCharCode(10))
      ok(answer)
    })
  })
}

async function signing() {
  const keystore =
    process.env.QUIZLOOP_KEYSTORE || join(homedir(), '.teknesyum', 'keys', 'quizloop-upload.jks')
  if (!existsSync(keystore)) {
    console.warn(`Keystore not found at ${keystore}: building unsigned`)
    return {}
  }
  const given = {}
  if (!process.env.QUIZLOOP_STORE_PASSWORD) {
    if (!process.stdin.isTTY) {
      console.warn('QUIZLOOP_STORE_PASSWORD is not set and there is no terminal: building unsigned')
      return {}
    }
    given.QUIZLOOP_STORE_PASSWORD = await hidden('Keystore password: ')
  }
  if (!process.env.QUIZLOOP_KEY_PASSWORD) {
    if (!process.stdin.isTTY) {
      console.warn('QUIZLOOP_KEY_PASSWORD is not set and there is no terminal: building unsigned')
      return {}
    }
    const typed = await hidden('Key password (empty = same as keystore): ')
    given.QUIZLOOP_KEY_PASSWORD = typed || given.QUIZLOOP_STORE_PASSWORD || process.env.QUIZLOOP_STORE_PASSWORD
  }
  if (!process.env.QUIZLOOP_KEYSTORE) given.QUIZLOOP_KEYSTORE = keystore
  return given
}

const extra = release ? await signing() : {}
const tasks = release ? ['assembleRelease', 'bundleRelease'] : ['assembleDebug']
const r = spawnSync(
  join(android, win ? 'gradlew.bat' : 'gradlew'),
  [...tasks, '--console=plain'],
  { cwd: android, env: { ...env, ...extra }, stdio: 'inherit', shell: win }
)
if (r.status !== 0) process.exit(r.status ?? 1)

const outDir = join(root, 'dist-android')
mkdirSync(outDir, { recursive: true })
const apkDir = join(android, 'app', 'build', 'outputs', 'apk', kind)
const signed = release && existsSync(join(apkDir, 'app-release.apk'))
const apk = release ? (signed ? 'app-release.apk' : 'app-release-unsigned.apk') : 'app-debug.apk'
const label = release && !signed ? 'release-unsigned' : kind
const target = join(outDir, `QuizLoop-${version}-${label}.apk`)
copyFileSync(join(apkDir, apk), target)
console.log(`${target} ${(statSync(target).size / 1048576).toFixed(1)} MB`)
if (release) {
  const aab = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
  const aabTarget = join(outDir, `QuizLoop-${version}-${label}.aab`)
  copyFileSync(aab, aabTarget)
  console.log(`${aabTarget} ${(statSync(aabTarget).size / 1048576).toFixed(1)} MB`)
}
