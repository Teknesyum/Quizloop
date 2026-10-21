import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkFolder } from '@core/commands/modules'
import { nodePorts } from '@main/ports'
import { SAMPLE_IDS } from '@shared/ipc'

const ROOT = resolve('resources/varsayilan')

describe('bundled default modules', () => {
  it('ships arapca, genel-kultur and ingilizce-lite only', () => {
    expect(readdirSync(ROOT).sort()).toEqual(['arapca', 'genel-kultur', 'ingilizce-lite'])
  })

  it.each([...SAMPLE_IDS])(
    '%s passes the module check with intact hashes',
    async (id) => {
      const { meta, count } = await checkFolder(nodePorts, join(ROOT, id))
      expect(meta.id).toBe(id)
      expect(count).toBe(meta.questionCount)
    },
    60_000
  )

  it('names the license and the open sources of the language modules', async () => {
    for (const id of ['arapca', 'ingilizce-lite']) {
      const { meta } = await checkFolder(nodePorts, join(ROOT, id))
      expect(meta.source?.title).toContain('CC BY-SA 4.0')
      expect(meta.source?.title).not.toContain('CEFR-J')
    }
  }, 60_000)
})
