export interface NewsEntry {
  version: string
  tr: string[]
  en: string[]
}

export const NEWS: NewsEntry[] = [
  {
    version: '0.7.63',
    tr: ['Her güncellemeden sonraki ilk açılışta gelen yenilikler bu pencerede özetlenir.'],
    en: ['On the first launch after every update, this window sums up what is new.']
  },
  {
    version: '0.7.62',
    tr: [
      '"Kaldığın Yerden Devam Et" kütüphanenin en üstünde, en büyük düğme.',
      'Kitap için tek düğme: sayfayı sorunun altında açar ve gizler, sayfa tam boy görünür.',
      'Bölümlerin liste görünümünde "Kısmenleri Çöz" düğmesi var.',
      'Telefonda oturum sırasında üst çubuk kaydırınca gider, ekran soruya kalır.'
    ],
    en: [
      '"Continue Where You Left Off" leads the library as its largest button.',
      'One book button: it opens and hides the page under the question, at full height.',
      'The list view of chapters has the "Solve Partly Known" button.',
      'On a phone the title bar scrolls away during a session, leaving the screen to the question.'
    ]
  },
  {
    version: '0.7.61',
    tr: ['Soru çözüldükten sonra yanlış bir şıkka tıklayınca neden yanlış olduğu açılır.'],
    en: ['After a question is solved, clicking a wrong choice shows why it is wrong.']
  }
]

function parts(version: string): number[] {
  return version.split('.').map((p) => Number.parseInt(p, 10) || 0)
}

export function compareVersions(a: string, b: string): number {
  const x = parts(a)
  const y = parts(b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export function newsSince(seen: string, current: string, limit = 3): NewsEntry[] {
  return NEWS.filter(
    (n) =>
      compareVersions(n.version, current) <= 0 &&
      (seen === '' || compareVersions(n.version, seen) > 0)
  ).slice(0, limit)
}
