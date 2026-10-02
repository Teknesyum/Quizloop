# Play Mağaza Girişi — Metinler

Play Console, Ana mağaza girişi bölümüne elle girilir. Varsayılan dil: İngilizce (ABD);
Türkçe (Türkiye) çeviri olarak eklenir.

## Genel

| Alan | Değer |
|---|---|
| Uygulama adı | QuizLoop (8 karakter, sınır 30) |
| Kategori | Eğitim (Education); tür: Uygulama |
| Ücret | Ücretsiz, reklamsız, uygulama içi satın alma yok |
| Gizlilik politikası URL | `https://github.com/Teknesyum/Quizloop/blob/main/PRIVACY.md` (commit ve push sonrası) |
| Web sitesi | `https://github.com/Teknesyum/Quizloop` |
| E-posta | Play'in zorunlu tuttuğu geliştirici e-postası hesap iletişiminden gelir; kamuya açık metne ayrıca yazılmaz |

Etiketler (Play'de seçilen etiketler, en fazla 5): Eğitim, Çalışma / Sınav hazırlığı,
Flash kart (flashcards), Kişisel verimlilik, Bilgi yarışması. Seçenek adı listede yoksa en
yakını seçilir; etiket metni serbest girilmez.

## İngilizce

**Kısa açıklama** (en fazla 80; 68 karakter):

```
Spaced-repetition quizzes from question modules you import yourself.
```

**Tam açıklama** (en fazla 4000):

```
QuizLoop is a study app for drilling multiple-choice questions until they stick. It schedules reviews with the FSRS spaced-repetition algorithm, so questions you find hard come back sooner and questions you know come back later.

QuizLoop does not come with study content. It ships with a short sample module that shows how the app works. To study your own material you import a question module, a .qlmod package, from your device. The app only reads the file you choose.

HOW A ROUND WORKS
- The question appears without its options, so you think first.
- You can ask for the options. Answering without them earns a bonus.
- A wrong pick costs points, removes that option and shows an explanation written for that specific wrong answer.
- When the question closes, the solution is shown together with its source: file, pages and the quoted passage. If the module includes the source book, the page opens in a built-in viewer with the passage highlighted.
- You rate the question as understood, partly understood or not understood. Understood questions retire.

FEATURES
- Spaced repetition scheduling (FSRS-6)
- Chapter sessions and mixed sessions across a whole module
- Per-answer explanations for wrong options
- Source reference for every question
- Built-in book viewer with pinch zoom for modules that include a book
- Progress, retired questions and a daily streak in the statistics screen
- Flag a question that looks wrong
- Works fully offline

PRIVACY
No account, no ads, no analytics. Your progress and settings stay on your device. The only network request the app makes is the update check you start yourself in Settings.

QuizLoop is free and open source under the AGPL-3.0-or-later license. Source code and the module format are on GitHub: https://github.com/Teknesyum/Quizloop
```

## Türkçe

**Kısa açıklama** (en fazla 80; 67 karakter):

```
Kendi içeri aldığınız soru modüllerinden aralıklı tekrarlı çalışma.
```

**Tam açıklama** (en fazla 4000):

```
QuizLoop, çoktan seçmeli soruları kafanıza yerleşene kadar çalıştıran bir çalışma uygulamasıdır. Tekrarları FSRS aralıklı tekrar algoritmasıyla planlar: zorlandığınız sorular daha erken, bildiğiniz sorular daha geç geri gelir.

QuizLoop çalışma içeriği getirmez. Uygulamanın nasıl çalıştığını gösteren kısa bir örnek modülle gelir. Kendi çalışma materyalinizi çalışmak için cihazınızdan bir soru modülü, yani .qlmod paketi, içeri alırsınız. Uygulama yalnızca seçtiğiniz dosyayı okur.

BİR TUR NASIL İŞLER
- Soru şıkları olmadan çıkar, önce siz düşünürsünüz.
- Şıkları isteyebilirsiniz. Şıksız cevap bonus kazandırır.
- Yanlış seçim puan düşürür, o şıkkı eler ve o yanlış cevaba özel yazılmış bir açıklama gösterir.
- Soru kapanınca çözüm, kaynağıyla birlikte görünür: dosya, sayfalar ve alıntılanan pasaj. Modül kaynak kitabı içeriyorsa sayfa, pasaj vurgulanmış hâlde yerleşik görüntüleyicide açılır.
- Soruyu anladım, kısmen anladım ya da anlamadım diye işaretlersiniz. Anlaşılan sorular emekli olur.

ÖZELLİKLER
- Aralıklı tekrar planlaması (FSRS-6)
- Bölüm oturumları ve modülün tamamından karışık oturumlar
- Yanlış şıklar için cevaba özel açıklamalar
- Her soru için kaynak gösterimi
- Kitap içeren modüller için iki parmak yakınlaştırmalı yerleşik kitap görüntüleyici
- İstatistik ekranında ilerleme, emekli sorular ve günlük seri
- Hatalı görünen soruyu işaretleme
- Tümüyle çevrim dışı çalışır

GİZLİLİK
Hesap, reklam ve analitik yoktur. İlerlemeniz ve ayarlarınız cihazınızda kalır. Uygulamanın yaptığı tek ağ isteği, Ayarlar'da kendinizin başlattığı güncelleme denetimidir.

QuizLoop ücretsiz ve AGPL-3.0-or-later lisanslı açık kaynaklı bir uygulamadır. Kaynak kod ve modül biçimi GitHub'dadır: https://github.com/Teknesyum/Quizloop
```

## Notlar

- İki metinde de telifli kitap adı, "en iyi", "no. 1", fiyat ya da emoji yok; Play meta veri
  politikasına uygun. Sürüm numarası ve "yeni" gibi zaman bildiren sözler de yok.
- Örnek modül ekran görüntülerinde "Örnek modülü kur" düğmesiyle görünüyor; metinde yalnızca
  "kısa örnek modül" deniyor, soru sayısı verilmiyor.
- Ekran görüntüleri (telefon-*.png) Türkçe arayüzdedir; İngilizce girişte de aynıları kullanılabilir,
  ya da İngilizce arayüzle yeniden çekilir.

## Görseller (`gorsel/`)

| Dosya | Play alanı | Boyut |
|---|---|---|
| `icon-512.png` | Uygulama simgesi | 512×512 PNG |
| `feature-1024x500.png` | Özellik grafiği | 1024×500 PNG |
| `telefon-01..06-*.png` | Telefon ekran görüntüleri (en az 2, en çok 8) | 1080×2137 PNG (oran 1,98:1, sınırın altında) |

Ekran görüntüleri yalnızca `modules/_ornek` örnek modülüyle çekildi; durum çubuğu ve gezinti
çubuğu kırpıldı.
