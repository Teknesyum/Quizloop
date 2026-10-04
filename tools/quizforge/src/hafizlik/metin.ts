export const DURAKLAR: Record<string, string> = {
  'ؕ': 'ط',
  'ۚ': 'ج',
  'ؗ': 'ز',
  'ࣕ': 'ص',
  'ࣗ': 'ق',
  'ࣞ': 'قف',
  'ۘ': 'م'
}

const DURAK = /[ؕؗۘۚࣕࣗࣞ]/

export const EN_AZ_KELIME = 3

export const AYET_SONU = '۝'

export function kelimeler(metin: string): string[] {
  return metin.split(/\s+/).filter(Boolean)
}

export function parcala(metin: string, enAz = EN_AZ_KELIME): string[][] {
  const parcalar: string[][] = []
  let acik: string[] = []
  for (const k of kelimeler(metin)) {
    acik.push(k)
    if (DURAK.test(k)) {
      parcalar.push(acik)
      acik = []
    }
  }
  if (acik.length) parcalar.push(acik)
  let i = 0
  while (parcalar.length > 1 && i < parcalar.length) {
    const p = parcalar[i]!
    if (p.length >= enAz) {
      i += 1
    } else if (i > 0) {
      parcalar[i - 1]!.push(...p)
      parcalar.splice(i, 1)
    } else {
      parcalar[1]!.unshift(...p)
      parcalar.splice(0, 1)
    }
  }
  return parcalar
}

export function sade(metin: string): string {
  return metin
    .replace(/[^ء-غف-يٱ-ۓ\s]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[یى]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
}

export function kok(metin: string): string {
  return sade(metin).replace(/[ءؤئاوي\s]/g, '')
}

export function ilkIki(sadeMetin: string): string | null {
  const k = sadeMetin.split(' ')
  return k.length >= 2 ? `${k[0]} ${k[1]}` : null
}

export function sonIki(sadeMetin: string): string | null {
  const k = sadeMetin.split(' ')
  return k.length >= 2 ? `${k[k.length - 2]} ${k[k.length - 1]}` : null
}
