# changesets

## Depo
changesets/changesets · https://github.com/changesets/changesets · **MIT** · son sürüm `@changesets/cli@3.0.1` 2026-08-19 · son push 2026-08-22 · 12.309 yıldız · 267 açık issue · ~7.5 MB, 22 paketlik monorepo. Yardımcı: `changesets/action` MIT, `v2.1.1` 2026-08-19, 1.061 yıldız, 76 açık issue.

## Ne için bakıldı
Quizloop CHANGELOG'u elle tutuyor, SemVer kullanıyor, üç platformu Actions matrisiyle çıkarıyor. Soru ikili: tek uygulama için bu araca gerek var mı, ve sürüm etiketini üç-OS matrisine bağlamanın yolu ne.

## Alınacak fikirler
- **Değişiklik notu, sürüm anında değil PR anında yazılır.** Her PR `.changeset/` altına küçük bir markdown bırakır: hangi paket, hangi sıçrama (major/minor/patch), tek cümle açıklama. `changeset version` bu dosyaları tüketip `package.json` sürümünü yükseltir ve `CHANGELOG.md`'yi yazar. Bizim için asıl kazanç bu: not, değişikliği yapanın aklındayken yazılıyor. Elle CHANGELOG'un kaybettiği tek şey de zaten bu — üç ay sonra commit günlüğünden not üretmek.
- **Quizloop tek paket değil.** `docs/PLAN.md` iki yazılımı tek depoda tutuyor: oynatıcı (Electron) ve `quizforge` (CLI). İkisi birbirinden bağımsız sürümlenebilir, aralarında bağımlılık olabilir. Changesets'in asıl işi tam bu — bağımlılık grafiğine bakıp bağımlının sürümünü de yükseltmek. Tek paketli olsaydık gerek yoktu; iki paketli olduğumuz an gerekçe doğuyor.
- **Etiketi matrise bağlama yolu belgede yazılı: iki ayrı iş akışı.** (1) `changesets/action` `main`'de çalışır, "Version Packages" adında bir PR açar. PR birleşince aynı akış sürümü işler ve git etiketi atar (`privatePackages: { version: true, tag: true }` gerekiyor, çünkü paketlerimiz npm'e gitmiyor). Aksiyonun `published`, `published-packages` (JSON dizi), `has-changesets` çıktıları var — koşullu adım kurmaya yeter. (2) İkinci akış `on: push: tags` ile tetiklenir ve `electron-builder` üç-OS matrisini çalıştırır. Changesets belgesi bunu kendi ağzıyla söylüyor: npm dışı biçimler için "etiket oluşturulmasına tepki veren iş akışları" yazılır. Yani sürüm kararı ile derleme birbirine doğrudan değmez, arada yalnız git etiketi vardır — Quizloop için doğru sınır.

## Kaçınılacaklar
- **Etiket biçimi doğrulanmadı.** Tek paketli depoda `v1.2.3`, çok paketlide `ad@1.2.3` üretildiği yaygın olarak söyleniyor ama ne belgede ne kaynakta doğrulayabildim. `electron-builder` ve yayın akışları `v*` bekler; kurulumda **ilk denenecek şey bu** olmalı, sonradan etiket biçimi değiştirmek geçmişi bozar.
- 267 açık issue. Olgun ve bakımlı bir proje (bu hafta commit var), ama küçük çözülmemiş davranış farkları biriktiği anlamına da geliyor.
- Gizli maliyet: `.changeset/` klasörü, `config.json`, bir bot PR'ı ve her PR'da "changeset ekledin mi" disiplini. Tek kişilik geliştirmede bot PR'ı bazen sadece gürültüdür — `changeset version` yerel çalıştırılıp doğrudan commit'lenebilir, aksiyon zorunlu değil.
- Araç `package.json` merkezli. Modül paketlerimiz (zip + METADATA) changesets'in görüş alanında değil; onların sürümlenmesi ayrı bir iş, bu araç oraya uzanmaz.

## Karar
**Bağımlılık** — ama yalnız CLI, aksiyon dalga 2'de. MIT, iki paketli yapımız gerekçeyi karşılıyor.
Kurulum sırası: `privatePackages` ayarı → tek deneme sürümüyle etiket biçimini doğrula → `on: push: tags` ile mevcut üç-OS matrisini bağla.
Etiket biçimi `v*` çıkmazsa `changeset tag` yerine etiketi elle atan tek adımlık bir betik yeter; araç yine de değerini korur.
