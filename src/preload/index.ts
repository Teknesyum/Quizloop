import { contextBridge, ipcRenderer, webFrame, webUtils } from 'electron'
import { CH, type QuizloopApi, type Settings } from '@shared/ipc'
import type { ChoiceKey } from '@shared/schema/question'

const api: QuizloopApi = {
  pathOf: (file) => {
    try {
      return webUtils.getPathForFile(file) || null
    } catch {
      return null
    }
  },
  app: {
    info: () => ipcRenderer.invoke(CH.appInfo)
  },
  window: {
    minimize: () => ipcRenderer.send(CH.winMin),
    toggleMaximize: () => ipcRenderer.send(CH.winMax),
    close: () => ipcRenderer.send(CH.winClose),
    isMaximized: () => ipcRenderer.invoke(CH.winIsMax),
    onMaximized: (cb) => {
      const h = (_: unknown, max: boolean): void => cb(max)
      ipcRenderer.on(CH.winMaxChanged, h)
      return () => ipcRenderer.removeListener(CH.winMaxChanged, h)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(CH.settingsGet),
    set: (patch: Partial<Settings>) => ipcRenderer.invoke(CH.settingsSet, patch),
    pickModulesDir: () => ipcRenderer.invoke(CH.settingsPickDir),
    zoom: (factor: number) => webFrame.setZoomFactor(factor)
  },
  module: {
    list: () => ipcRenderer.invoke(CH.moduleList),
    install: (path: string) => ipcRenderer.invoke(CH.moduleInstall, path),
    installSample: () => ipcRenderer.invoke(CH.moduleInstallSample),
    pick: () => ipcRenderer.invoke(CH.modulePick),
    remove: (id: string) => ipcRenderer.invoke(CH.moduleRemove, id),
    chapters: (id: string) => ipcRenderer.invoke(CH.moduleChapters, id)
  },
  session: {
    start: (moduleId: string, chapter?: string | null) =>
      ipcRenderer.invoke(CH.sessionStart, moduleId, chapter ?? null),
    known: (id: string) => ipcRenderer.invoke(CH.sessionKnown, id),
    reveal: (id: string) => ipcRenderer.invoke(CH.sessionReveal, id),
    answer: (id: string, key: ChoiceKey) => ipcRenderer.invoke(CH.sessionAnswer, id, key),
    grade: (id: string, self, ms: number) => ipcRenderer.invoke(CH.sessionGrade, id, self, ms),
    flag: (id: string, note?: string) => ipcRenderer.invoke(CH.sessionFlag, id, note),
    end: (id: string) => ipcRenderer.invoke(CH.sessionEnd, id)
  },
  stats: {
    overview: () => ipcRenderer.invoke(CH.statsOverview)
  }
}

contextBridge.exposeInMainWorld('quizloop', api)
