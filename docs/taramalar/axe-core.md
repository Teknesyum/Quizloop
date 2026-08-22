# axe-core

## Depo
dequelabs/axe-core · https://github.com/dequelabs/axe-core · **MPL-2.0 (MIT/Apache/BSD değil)** · v4.13.0, 2026-08-05 · 7.4k yıldız · depo ~20 MB, npm paketi açılmış hâlde ~3,1 MB, 154 kural.

## Ne için bakıldı
Sınav arayüzü saatlerce klavyeden sürülecek. Odak sırası, ARIA adlandırma ve kontrast hataları elle test edilmez; her PR'da otomatik denetlenmesi gerekiyor. Soru: bu denetim CI'a konabilir mi, Electron renderer'ında koşar mı.

## Alınacak fikirler
- **Denetim çalıştırılabilir kural motoru olarak paketlenmiş.** `axe.run` bir DOM bağlamı alır, `violations` / `incomplete` / `passes` döner; "kesin değil, insan baksın" için ayrı kova var. Quizloop'ta erişilebilirlik testi Playwright/Vitest+jsdom içinde tek çağrıya iner, kendi kontrol listemizi yazmaktan kurtarır.
- **Kural seçimi bağlama göre otomatik, ayrıca etiketle filtrelenebilir** (`wcag2a`, `wcag2aa`, `best-practice`). Sınav arayüzünde asıl önemli olan dar bir alt küme: `aria-allowed-attr`, `aria-required-attr`, `label`, `button-name`, `focus-order-semantics`, `color-contrast`, `region`, `duplicate-id-aria`. CI'ı bu etiketlerle dar tutup gürültüyü kesmek mümkün.
- **İhlal çıktısı düğüm + `failureSummary` + yardım bağlantısı içeriyor.** Ekip içi rapor üretmeden hata mesajı okunabilir oluyor. Aynı desen Quizloop'un şema doğrulayıcısında da işe yarar: hatayı "nerede, neden, ne yapmalı" üçlüsüyle döndür.

## Kaçınılacaklar
- **Lisans: MPL-2.0.** GPL/AGPL değil, OSI onaylı ve dosya düzeyinde zayıf copyleft — ayrı bir npm paketi olarak kullanıldığında MIT ürünü kirletmez. Yine de **yalnız `devDependencies`'te tutulmalı**, uygulama paketine gömülmemeli; axe kaynağında değişiklik yapılırsa değişen dosyalar MPL kalır.
- **jsdom desteği kısmi.** README açıkça `color-contrast` kuralının jsdom'da çalışmadığını söylüyor. Kontrast denetimi istiyorsak gerçek tarayıcı (Playwright / Electron renderer) gerekir; jsdom testinde o kural kapatılmalı.
- **"Ortalama WCAG sorunlarının %57'si otomatik bulunur" iddiası README'de, kaynağı Deque'nin kendi ölçümü — bağımsız doğrulanamadı.** Otomatik denetimi tek kapı sanmamak lazım; klavye akışı elle test edilmeye devam etmeli.
- Renderer'a canlı gömme (uygulama içinde denetim) hem paket boyutu hem lisans yüzeyi getirir; gereksiz.
- 437 açık issue var; kural yorumları sürüm arası değişebiliyor, minor yükseltmede yeni ihlaller belirebilir. Sürüm sabitlenmeli.

## Karar
`desen` + test-zamanı bağımlılığı. CI'da Playwright ile Electron renderer'a enjekte edilip dar bir kural kümesiyle koşturulur; `devDependencies` dışına asla çıkmaz (MPL). Ürün koduna girmez.
