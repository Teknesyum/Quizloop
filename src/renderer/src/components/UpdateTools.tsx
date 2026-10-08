import { useEffect, useRef, useState } from 'react'
import {
  UpdateBadge,
  VersionButton,
  type VersionCheck
} from '../../../../teknesyum-ui/durum/UpdateBadge'
import { UpdatePanel, type UpdateState } from '../../../../teknesyum-ui/durum/UpdatePanel'
import { useUpdate } from '@renderer/hooks/useUpdate'
import { useApp } from '@renderer/store/app'
import { t } from '@renderer/i18n'
import type { UpdateStatus } from '@shared/ipc'

const UPDATED_LIFE = 5000

function settled(first: UpdateStatus): Promise<UpdateStatus> {
  if (first.state !== 'checking') return Promise.resolve(first)
  return new Promise((ok) => {
    const off = window.quizloop.update.onStatus((s) => {
      if (s.state === 'checking') return
      off()
      ok(s)
    })
  })
}

function toCheck(s: UpdateStatus): VersionCheck {
  if (
    s.state === 'available' ||
    s.state === 'notice' ||
    s.state === 'downloading' ||
    s.state === 'ready'
  )
    return { state: 'available', latest: s.version }
  if (s.state === 'error') return { state: 'error', message: s.error ?? '' }
  return { state: 'current' }
}

function toPanel(s: UpdateStatus): UpdateState | null {
  const latest = s.version
  if (s.state === 'available' || s.state === 'notice')
    return { phase: 'available', percent: 0, latest }
  if (s.state === 'downloading') return { phase: 'downloading', percent: s.percent ?? 0, latest }
  if (s.state === 'ready') return { phase: 'ready', percent: 100, latest }
  if (s.state === 'error') return { phase: 'error', percent: 0, message: s.error ?? '' }
  return null
}

export function useUpdateTools(): {
  version: React.JSX.Element | null
  label: React.JSX.Element | null
  update: React.JSX.Element
} {
  const up = useUpdate()
  const toast = useApp((s) => s.toast)
  const said = useRef(false)
  const [version, setVersion] = useState('')
  const [open, setOpen] = useState(false)
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const u = window.quizloop.update
  const notice = up.state === 'notice'
  const inSession = useApp((s) => s.route.name === 'session')
  const offered = useRef(false)
  const offer = (up.state === 'available' || notice) && !inSession

  useEffect(() => {
    if (!offer || offered.current) return
    offered.current = true
    setOpen(true)
  }, [offer])

  useEffect(() => {
    void window.quizloop.app.info().then((i) => setVersion(i.version))
  }, [])

  useEffect(() => {
    if (up.state !== 'updated' || said.current) return
    said.current = true
    toast('success', t('update.updated', { version: up.version ?? '' }), UPDATED_LIFE)
  }, [up.state, up.version, toast])

  const phase =
    up.state === 'available' || up.state === 'notice'
      ? 'available'
      : up.state === 'downloading' || up.state === 'ready'
        ? up.state
        : null

  const versionNode = version ? (
    <VersionButton
      version={`v${version}`}
      check={async () => toCheck(await settled(await u.check()))}
      install={() => setOpen(true)}
      labels={{
        check: t('update.check'),
        current: () => t('update.current'),
        error: (reason) => (reason ? t('update.errorReason', { reason }) : t('update.error'))
      }}
    />
  ) : null

  const labelNode = version ? <span className="ql-version">{`v${version}`}</span> : null

  const updateNode = (
    <span className="ql-update">
      <UpdateBadge
        phase={phase}
        percent={up.percent ?? 0}
        version={up.version}
        labels={{
          available: t('update.label'),
          downloadingPercent: (percent) => t('update.badgeDownloading', { percent }),
          ready: t('update.badgeReady'),
          availableAria: (v) => t('update.ariaAvailable', { version: v }),
          downloadingAria: (percent) => t('update.ariaDownloading', { percent }),
          readyAria: t('update.ariaReady'),
          downloadTitle: t('update.get'),
          installTitle: t('update.apply')
        }}
        onOpen={(el) => {
          setOpener(el)
          setOpen(true)
        }}
      />
      <UpdatePanel
        open={open}
        state={toPanel(up)}
        returnTo={opener}
        labels={{
          title: t('update.title'),
          versionLabel: t('update.versionLabel'),
          notesLabel: t('update.notesLabel'),
          dryRun: t('update.dryRun'),
          available: t('update.panelAvailable'),
          downloading: t('update.panelDownloading'),
          ready: t('update.panelReady'),
          installing: t('update.panelInstalling'),
          failed: (reason) => t('update.panelFailed', { reason }),
          downloadInstall: t('update.now'),
          download: t('update.get'),
          cancel: up.state === 'downloading' ? t('update.cancel') : t('update.later'),
          install: t('update.apply'),
          close: t('update.close'),
          retry: t('update.retry'),
          progress: t('update.progress')
        }}
        onClose={() => setOpen(false)}
        onDownload={(andInstall) => {
          if (notice) {
            u.open()
            setOpen(false)
          } else u.download(andInstall)
        }}
        onCancel={() => u.cancel()}
        onInstall={() => u.install()}
        onCheck={() => void u.check()}
      />
    </span>
  )
  return { version: versionNode, label: labelNode, update: updateNode }
}
