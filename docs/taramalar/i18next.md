# i18next/i18next

## Depo
`i18next` · https://github.com/i18next/i18next · MIT · son sürüm `v26.4.0` (2026-08-20) · son commit 2026-08-20 · ★8.619 · **2 açık issue** · npm paketi 523 KB / 19 dosya, **çalışma-zamanı bağımlılığı yok** (yalnız isteğe bağlı `typescript` peer'ı), ESM + CJS ikili çıktı.

## Ne için bakıldı
Arayüz metinlerinin Türkçe ve İngilizce tutulması. Soru: çoğul ve sayı biçimlendirmesi Türkçe'de doğru mu, Electron'un ana süreci ile renderer'ı aynı dilde nasıl tutulur, bunu birinci sürüme koymak erken mi.

## Alınacak fikirler
- **Çoğul ve biçimlendirme Intl'e devredilmiş, kendi tablosu yok.** `src/PluralResolver.js` `new Intl.PluralRules(lng, {type})` kurup sonucu önbelleğe alıyor, Intl yoksa hata basıyor; `src/Formatter.js` `Intl.NumberFormat`/`DateTimeFormat`/`RelativeTimeFormat`/`ListFormat` sarmalıyor. Türkçe CLDR kategorileri Node ile doğrulandı: `0→other, 1→one, 2→other, 5→other`, sayı `1.234,5`, tarih `22 Ağustos 2026`, sıralı sayı `3→other`. Yani `_one`/`_other` anahtar çifti yeterli, ICU eklentisi gerekmiyor ve Electron'un V8'i tam ICU ile geldiği için polyfill de gerekmiyor. Değeri: "5 soru" / "5 questions" farkı tek anahtar şemasıyla çözülür.
- **Dilin tek sahibi ana süreç.** Ayar dosyasında saklanan dil ana süreçte tutulur; renderer açılışta IPC ile okur, kullanıcı değiştirince ana süreç önce kendi örneğini `changeLanguage` ile günceller, sonra renderer'a yayınlar. Menü, dialog, tepsi ve bildirim metinleri ana süreçte, arayüz renderer'da — iki i18next örneği, **tek kaynak JSON'u ve tek dil değişkeni**. Değeri: "menü İngilizce, ekran Türkçe" sınıfı hatayı baştan kapatır.
- **Metinleri koddan çıkarmak, çeviriyi sonraya bırakmak.** Birinci sürümde motor + `tr` kaynak dosyası kurulur, `en` sonradan doldurulur. Değeri: asıl maliyet i18next değil, dağılmış dizeleri sonradan toplamak; motor kurulumu sıfır bağımlılıkla 523 KB.

## Kaçınılacaklar
- **Modül içeriğini i18next'e sokmak.** Soru metni, şıklar ve açıklamalar modül paketinin verisidir, METADATA'daki dil alanına aittir; arayüz sözlüğüyle karıştırılırsa çeviri dosyası modül sayısıyla büyür. Sınır net çizilmeli: i18next yalnız uygulama kabuğunu çevirir.
- **Türkçe cümleyi anahtar yapmak.** `t("Soruyu atla")` tipi kullanım metin düzeltildiğinde tüm çevirileri düşürür; nokta ayrımlı anahtar (`quiz.skip`) kullanılmalı.
- **Ek paket yığmak.** `i18next-icu`, Intl polyfill'i, `i18next-fs-backend` gibi eklentiler bu senaryoda gereksiz: tüm çeviriler uygulama paketinin içinde, `resources` olarak doğrudan verilebilir. React tarafında `react-i18next` ayrı depo ve ayrı sürüm hattıdır — alınacaksa uyumu ayrıca izlenmeli.
- **Türkçe'yi İngilizce çoğul mantığıyla yazmak.** Türkçe'de sayıdan sonra çoğul eki gelmez ("5 soru"), bu yüzden çoğu anahtarda tek biçim yeterli; İngilizce'de iki biçim gerekir. Şablonu İngilizce'ye göre kurup Türkçe'yi ona uydurmak yapay metin üretir.

## Karar
`bağımlılık` — birinci sürümde motor + `tr` kaynak, `en` boş iskelet. Sıfır çalışma-zamanı bağımlılığı ve MIT lisansı ile risk yok; erken değil, çünkü sonradan eklemenin maliyeti kod içine dağılmış dizeleri toplamaktır.
