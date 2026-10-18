export interface NewsEntry {
  version: string
  tr: string[]
  en: string[]
}

export const NEWS: NewsEntry[] = [
  {
    version: '0.7.70',
    tr: [
      'Bize Ulaş artık uygulamanın içinde bir form: notunu, istersen sana ulaşma yolunu ve bir görüntü yazıp doğrudan bize gönderebilirsin.',
      'Paylaş, Android uygulama bağlantısını ve web sürümünü birlikte gönderiyor.',
      'Bitir demeden uygulama kapansa da verdiğin cevaplar kaybolmuyor; Karışık oturumdaki cevaplar sorunun kendi bölümüne işleniyor.'
    ],
    en: [
      'Contact Us is now a form inside the app: write your note, optionally how to reach you and an image, and send it straight to us.',
      'Share sends the Android app link and the web version together.',
      'Your answers are kept even if the app closes before you press Finish; answers in a Mixed session count toward each question’s own chapter.'
    ]
  },
  {
    version: '0.7.69',
    tr: [
      'Kitabı içinde olan modüllerde görseller doğrudan kitaptan çiziliyor; modül paketleri küçülüyor.',
      'Eski modüller görselleriyle eskisi gibi açılıyor.',
      'Uygulamadan yeni bir modül kurarken uygulama güncellemesi gerekiyorsa bunu söylüyor.'
    ],
    en: [
      'In modules that carry their book, images are drawn straight from the book, so module packages get smaller.',
      'Older modules open with their images as before.',
      'Installing a module that needs a newer app now says so.'
    ]
  },
  {
    version: '0.7.68',
    tr: [
      'Telefonda Paylaş ve Bize Ulaş sağ üstteki üç nokta menüsünde.',
      'Bir bölümde az kavram olsa da soruların hepsi oturuma giriyor; aynı kavramın soruları araya başka soru girerek gelir.',
      'Görselde işaretleme soruları doğrudan işaretlemeyle başlar; görsel basılı tutunca büyür, büyümüş görselde de kutu seçilir.',
      'Kitabı otomatik açma, açılan kitap panelinin sol üstünde bir anahtar oldu.',
      'Anlat düğmesi her soruda görünür; anlatımı olmayan soruda bunu söyler.'
    ],
    en: [
      'On a phone, Share and Contact Us are in the three-dot menu at the top right.',
      'Every question of a chapter enters the session even when it has few concepts; questions of one concept come with others in between.',
      'Marking questions start in marking mode; press and hold enlarges the image, and boxes can be picked in the enlarged view.',
      'Opening the book automatically is now a switch at the top left of the book panel.',
      'The Explain button shows on every question and says so when a question has no explanation.'
    ]
  },
  {
    version: '0.7.67',
    tr: [
      'Telefonda tablolar ekrana sığıyor; uzun satır başlıkları artık alt satıra geçiyor.',
      'Kitap sayfasında boş kalan şekiller çiziliyor.',
      'Telefonda saat ve gezinme tuşları artık yazının ve düğmelerin üstüne binmiyor.',
      'Dokunduğun şık, sonraki soruda seçili gibi kalmıyor.'
    ],
    en: [
      'Tables fit the phone screen; long row headings now wrap.',
      'Figures that stayed blank on a book page are drawn.',
      'On a phone the clock and the navigation keys no longer sit on top of text and buttons.',
      'The option you tapped no longer looks selected on the next question.'
    ]
  },
  {
    version: '0.7.66',
    tr: [
      'Paylaş: Ayarlar, Hakkında bölümünden QuizLoop bağlantısını bir arkadaşına gönderebilirsin.',
      'Üst çubuktaki boyut denetimi yenilendi.'
    ],
    en: [
      'Share: send the QuizLoop link to a friend from Settings, About.',
      'The size control in the top bar was renewed.'
    ]
  },
  {
    version: '0.7.65',
    tr: [
      'Bize Ulaş: Ayarlar, Hakkında bölümünden ve Kataloglar ekranından sorun, öneri ya da şikâyet yazabilirsin.'
    ],
    en: [
      'Contact Us: write a problem, an idea or a complaint from Settings, About or the Catalogs screen.'
    ]
  },
  {
    version: '0.7.64',
    tr: [
      'Kataloglar: yayıncının verdiği tek adresi yapıştır, kanallarından istediğine abone ol.',
      'Abone olduğun modül, kanalı güncellendikçe kendiliğinden güncellenir.',
      'Aboneliği istediğin zaman bırakırsın; modül ve ilerlemen kütüphanede kalır.'
    ],
    en: [
      'Catalogs: paste the one address a publisher gives you and subscribe to its channels.',
      'A subscribed module updates itself whenever its channel does.',
      'Unsubscribe whenever you like; the module and your progress stay in the library.'
    ]
  },
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
