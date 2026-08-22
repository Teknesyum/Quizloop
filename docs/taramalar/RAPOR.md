# Ön araştırma raporu

`docs/taramalar/` altında 50 tarama dosyası var: 17'si konu taraması (bir başlıkta birden çok depo), 33'ü tek depo taraması. Toplam 100'ün üzerinde depo, spesifikasyon ve paket incelendi. Bütün ölçümler ve depo rakamları 2026-08-22 tarihli çekimlerden geliyor.

## Kapsam

| Başlık | Dosya | Taranan depolar | Bulgu |
| --- | --- | --- | --- |
| Anki çekirdeği | anki-cekirdek.md | anki, py-fsrs, obsidian-spaced-repetition, ts-fsrs | Şema sıfırdan yazılır, ts-fsrs bağımlılık alınır, revlog ilk günden tam alanlarla açılır. |
| Dayanıklı hat | dayanikli-hat.md | nextflow, langgraph, bullmq | Append-only JSONL ledger + içerik hash'li iş kimliği; kuyruk motoru ve harici sunucu yok. |
| Electron güvenlik | electron-guvenlik.md | electron, electronegativity, logseq, DOMPurify | `quizloop-asset://` özel şeması, kök içinde kalma kontrolü, `sandbox: true`, dar IPC yüzeyi. |
| Electron iskelet | electron-iskelet.md | electron-vite, electron-react-boilerplate, forge, electron-builder | electron-vite@^5 + electron-builder@^26; Forge ve boilerplate elendi. |
| Erişilebilirlik | erisilebilirlik.md | anki, react-spectrum, tinykeys | tinykeys + tek `shortcuts.ts` haritası; react-aria'dan yalnız focus ve live-announcer. |
| FSRS ailesi | fsrs.md | fsrs4anki, ts-fsrs, fsrs-rs | ts-fsrs doğrudan bağımlılık; optimizer v1'de kurulmaz, varsayılan parametrelerle çıkılır. |
| İçerik render | icerik-render.md | streamdown, assistant-ui, KaTeX | Yarım Markdown onarımı + rAF typer; formül KaTeX, MathJax alınmaz. |
| İlerleme şeması | ilerleme-semasi.md | anki, CrowdAnki, ts-fsrs | `reviews` append-only, kalıcı soru id + ayrı `icerik_hash`, sürümlü göç ve yedek. |
| LLM soru üretimi | llm-soru-uretimi.md | obsidian-quiz-generator, PageLM, Questgen.ai | Önce alıntı sonra soru; çeldiriciyi kod eler, onarım katmanı dolgu üretmez. |
| PDF çıkarma | pdf-cikarma.md | PyMuPDF, pdfplumber, camelot, unstructured, pypdfium2, mupdf.js | Çıkarma ayrı Python yan süreci; dağıtılan motor pypdfium2 + pdfplumber. |
| PDF → LLM hattı | pdf-llm-hatti.md | marker, docling, nougat | Birincil seçim docling; marker ikinci geçiş, nougat lisans nedeniyle dışarıda. |
| Quiz uygulamaları | quiz-uygulamalari.md | moodle, perseus, h5p-multi-choice | Şık başına açıklama zorunlu alan; append-only deneme günlüğü; puanlama render'dan ayrı. |
| Şema doğrulama | sema-dogrulama.md | zod, ajv, typebox | Zod v4 tek şema kaynağı, JSON Schema ondan türetilir; ajv ve typebox alınmaz. |
| Soru formatları | soru-formatlari.md | QTI 3.0, qti-examples, qti3-item-player, qti-components, anki, genanki, GIFT, quizdown-js | İç format kendimizin; ilk dışa aktarma hedefi GIFT, QTI yalnız referans. |
| Masaüstü SRS | srs-masaustu.md | mnemosyne, obsidian-spaced-repetition, Incrementum | Modül paketi zip + meta + medya; ilerleme içerikten ayrı, kalıcı id ile bağlı. |
| Türkçe metin | turkce-metin.md | sqlite (FTS5), icu/Intl, zemberek-nlp, snowball | Tek `fold(tr)` fonksiyonu + ayrı `search_text` sütunu; sıralama JS'te Intl.Collator ile. |
| Yerel modül paketleme | yerel-modul-paketleme.md | better-sqlite3, electron-builder, electron/rebuild | better-sqlite3 12.x pinlenir, rebuild yalnız electron-builder fazında, üç-OS matrisi. |

| Depo | Dosya | Karar | Gerekçe |
| --- | --- | --- | --- |
| anthropic-sdk-typescript | anthropic-sdk.md | bağımlılık | MIT, model çağrısının tek resmî yolu; yapılandırılmış çıktı ve HTTP yeniden denemesi hazır. |
| archiver | archiver.md | bağımlılık | Yalnız quizforge tarafında zip yazmak için; açma yauzl + METADATA whitelist ile. |
| axe-core | axe-core.md | desen | MPL-2.0; yalnız devDependency, CI'da dar kural kümesiyle koşar, ürün koduna girmez. |
| bottleneck | bottleneck.md | desen | Reservoir/minTime ayrımı alınır; depo 2020'den beri durgun, Redis yüzeyi var. |
| changesets | changesets.md | bağımlılık | İki paketli depo gerekçeyi karşılıyor; yalnız CLI, aksiyon dalga 2'de. |
| commander.js | commander.md | bağımlılık | MIT, beş alt komut için yeterli; ayrıştırma sınırında kalır. |
| DOMPurify | dompurify.md | elendi | `rehype-raw` yokken ham HTML geçmiyor; ikinci kalkan gereksiz. |
| drizzle-orm | drizzle-orm.md | desen | Göç günlüğü deseni alınır; 10 MB paket 5 tablolu şema için orantısız. |
| electron-store | electron-store.md | bağımlılık | Yalnız kullanıcı ayarları, ana süreçte, IPC arkasında; `migrations` kullanılmaz. |
| fastest-levenshtein | fastest-levenshtein.md | elendi | Alıntı doğrulaması alt dize, tekrar tespiti Jaccard; düzenleme uzaklığına yer yok. |
| genanki-js | genanki-js.md | desen | AGPL-3.0, kod alınamaz; `.apkg` üçlü ayrımı ve medya numaralandırma alınır. |
| hash-wasm | hash-wasm.md | elendi | `node:crypto` akışı ve SHA-256'yı bedavaya veriyor. |
| i18next | i18next.md | bağımlılık | Sıfır çalışma-zamanı bağımlılığı; çoğul ve biçimlendirme Intl'e devredilmiş. |
| instructor-js | instructor-js.md | desen | Onarım turunun mesaj kurgusu alınır; paket bakımsız, OpenAI'ye ve zod v3'e bağlı. |
| kysely | kysely.md | bağımlılık | Koşullu; sürücü yapısal arayüz arkasında, göç motoru statik sağlayıcıyla çalışıyor. |
| p-retry | p-retry.md | bağımlılık | Üç kancalı yeniden deneme ayrımı kendi döngümüzden iyi; varsayılanlar ezilir. |
| pdf-lib | pdf-lib.md | elendi | Metin ve görsel çıkaramıyor, outline için hazır API yok, bakım 2021'de durmuş. |
| pdf.js | pdfjs.md | desen | `getOutline` üçlüsü referans alınır; ikinci motor taşımaya değmiyor. |
| pino | pino.md | bağımlılık | JSONL yerli biçimi; yalnız `pino.destination`, transport'suz. |
| Playwright | playwright.md | bağımlılık | Yalnız devDependency, uçtan uca duman testi; `_electron` deneysel, sürüm sabitlenir. |
| qti-components | qti-components.md | elendi | GPL-3.0 bağımlılığı kapatıyor; dönüştürücü/oluşturucu ayrımı desen olarak alınır. |
| react-markdown | react-markdown.md | bağımlılık | PLAN.md seçimi doğrulandı, `rehype-raw`'suz hâliyle. |
| recharts | recharts.md | elendi | Isı haritası bileşeni yok, redux merkezli bağımlılık zinciri ağır. |
| sharp | sharp.md | bağımlılık | Yalnız quizforge CLI'da; LGPL libvips ikilisi son kullanıcı paketine girmez. |
| srs-benchmark | srs-benchmark.md | desen | Lisanssız; ölçüm yöntemi ve varsayılan parametre kararı için kanıt kaynağı. |
| TanStack Query | tanstack-query.md | desen | Tek yazar main süreç; hiyerarşik anahtar fikri IPC sarmalayıcısına taşınır. |
| TanStack Virtual | tanstack-virtual.md | bağımlılık | Yalnız soru bankası ve istatistik listelerinde, eşik üstünde. |
| umzug | umzug.md | desen | Electron'da glob çalışmıyor; sıralı ad listesi + defter tablosu ~50 satır. |
| update-electron-app | update-electron-app.md | desen | Linux'u kapsamıyor, paketleme hedefini Squirrel'a çevirmeyi istiyor. |
| visx | visx.md | bağımlılık | Yalnız altı alt paket; renk kararı bizde kalıyor, ısı haritası parçası var. |
| Vitest | vitest.md | bağımlılık | Tek `vitest.config.ts` + `projects: [main(node), renderer(jsdom)]`. |
| yaml (eemeli) | yaml.md | bağımlılık | Yorum koruyan gidiş-dönüş ve `linePos`'lu hata, js-yaml'ın veremediği iki şey. |
| Zustand | zustand.md | bağımlılık | Oturum makinesi ve UI durumu için tek store; `replace` ve `persist` yasak. |

## Depo envanteri

| Depo | Lisans | Ne için bakıldı | Alınabilir mi |
| --- | --- | --- | --- |
| ankitects/anki | AGPL-3.0+ (NOASSERTION) | Şema, kuyruk, revlog, kısayol, istatistik, göç, `.apkg` | desen |
| open-spaced-repetition/ts-fsrs | MIT | Zamanlayıcı | bağımlılık |
| open-spaced-repetition/fsrs-rs | BSD-3-Clause | Varsayılan parametreler, `parameter_clipper` | desen |
| py-fsrs · fsrs4anki · @open-spaced-repetition/binding | MIT | Optimizer API'si, derece anlamları, eşikler, napi/WASI eğitim | elendi |
| open-spaced-repetition/srs-benchmark | lisans yok | Ölçüm yöntemi, varsayılan parametre kanıtı | desen |
| obsidian-spaced-repetition · Stvad/CrowdAnki | MIT | İçerik/ilerleme ayrımı ve kuyruk katmanı; UUID ile içe aktarma, zorunlu yedek | desen |
| mnemosyne-proj/mnemosyne · melpomenex/Incrementum | AGPL-3.0 + marka şartı · Apache-2.0 | Paket biçimi, olay akışlı içe aktarma; Tauri+React SRS | desen |
| nextflow · langgraph · bullmq | Apache-2.0 · MIT · MIT | İçerik hash'li iş kimliği ve resume; kısmi başarı kaydı; hız sınırı ve stalled iş | desen |
| litellm · graphile-worker · inngest | NOASSERTION · — · NOASSERTION | LLM proxy, iş kuyruğu | elendi |
| electron/electron · doyensec/electronegativity | MIT · Apache-2.0 | Güvenlik normu ve `protocol.handle`; tek seferlik güvenlik denetimi | bağımlılık · desen |
| logseq/logseq | AGPL-3.0 | `assets://` işleyicisi (karşı-örnek) | elendi |
| alex8088/electron-vite | MIT | Üç girişli tek config, HMR | bağımlılık |
| electron-userland/electron-builder | MIT | Paketleme, imzalama, yaşam döngüsü | bağımlılık |
| electron/rebuild | MIT | Native modül yeniden derleme | bağımlılık |
| electron-react-boilerplate · electron/forge | MIT · MIT | İskelet ve paketleme zinciri | elendi |
| samuelmeuli/action-electron-builder | — (arşivli) | CI matrisi | elendi |
| WiseLibs/better-sqlite3 | MIT | Yerel veritabanı | bağımlılık |
| prebuildify · prebuild-install · node:sqlite · sql.js · libsql | — | Prebuild zinciri, geri düşüş sürücüsü | elendi |
| adobe/react-spectrum (react-aria) | Apache-2.0 | Odak yönetimi, canlı duyuru | bağımlılık |
| jamiebuilds/tinykeys | MIT | Kısayol bağlama | bağımlılık |
| hotkeys-js · pacocoursey/cmdk (dip/cmdk) | — | Kısayol, komut paleti | elendi |
| vercel/streamdown (+ remend) · assistant-ui | Apache-2.0 (NOASSERTION) · MIT | Yarım Markdown onarımı; rAF typer, reduced-motion | desen |
| KaTeX/KaTeX | MIT | Formül render | bağımlılık |
| mathjax/MathJax · typed.js · react-type-animation | Apache-2.0 · GPL-3.0 (npm) · — | Formül render, daktilo efekti | elendi |
| remarkjs/react-markdown | MIT | Markdown render | bağımlılık |
| cure53/DOMPurify | MPL-2.0 OR Apache-2.0 | Sanitizasyon | elendi |
| ECuiDev/obsidian-quiz-generator | MIT | İstem kurulumu, insan-okunur kayıt | desen |
| CaviraOSS/PageLM | PageLM Community License | Çıktı disiplini, YAML sınav planı | desen |
| ramsrigouthamg/Questgen.ai | MIT | Çeldirici eleme, önce alıntı sonra soru | desen |
| fbellame/pdf-to-quizz · Leaf-Question-Generation | lisanssız · — | Soru üretimi | elendi |
| pymupdf/PyMuPDF | AGPL-3.0 | Konumlu görsel, `/Outlines` | elendi |
| pdfplumber · camelot-dev/camelot · pypdfium2 | MIT · MIT · Apache-2.0/BSD-3 | Metin ve bbox; tablo + kalite metriği; AGPL'siz render ve görsel sökme | bağımlılık |
| atlanhq/camelot · Unstructured-IO/unstructured · mupdf.js | NOASSERTION · Apache-2.0 · AGPL-3.0 | Tablo, tek kapı belge işleme, Node PDF | elendi |
| mozilla/pdf.js | Apache-2.0 | `getOutline`, metin katmanı | desen |
| Hopding/pdf-lib | MIT | Sayfa aralığına bölme, outline | elendi |
| datalab-to/marker | Apache-2.0 kod, OpenRAIL-M ağırlık | Yapılı belge çıkarma | desen |
| docling-project/docling (+ docling-ibm-models) | MIT | Yapılı belge çıkarma, TableFormer | bağımlılık |
| datalab-to/surya · facebookresearch/nougat | Apache-2.0 · MIT kod + CC-BY-NC ağırlık | OCR/VLM, sayfa görüntüsü → markup | elendi |
| moodle/moodle · Khan/perseus · h5p/h5p-multi-choice | GPL-3.0 · MIT · MIT | Soru bankası ve deneme günlüğü; paket sınırı ve `rationale`; taşınabilir soru JSON'u | desen |
| h5p/h5p-php-library | GPL-3.0 | H5P çalışma zamanı | elendi |
| colinhacks/zod | MIT | Şema tek kaynağı | bağımlılık |
| ajv-validator/ajv · sinclairzx81/typebox | MIT · MIT (NOASSERTION) | Derlenmiş doğrulayıcı, JSON Schema birincil tasarım | elendi |
| QTI 3.0 spesifikasyonu · qti-examples · qti3-item-player | 1EdTech telifi · lisans yok · MIT | Paketleme ve sürümleme deseni; resmî örnek havuzu; oynatıcı referansı | desen |
| Citolab/qti-components | GPL-3.0-only | QTI feedback modeli, paket sınırı | elendi |
| krmanik/genanki-js · kerrickstaley/genanki | AGPL-3.0 (NOASSERTION) · MIT | `.apkg` üretimi; AGPL'siz bağımsız yazıcı | desen |
| GIFT (Moodle) · GIFT-grammar-PEG.js | GPL-3.0 · MIT | Birinci dışa aktarma hedefi ve ayrıştırıcı referansı | desen |
| bonartm/quizdown-js · Aiken | MIT (arşivli) · — | Markdown sınav sözdizimi, dışa aktarma hedefi | elendi |
| sqlite/sqlite (FTS5) | public domain (NOASSERTION) | Tam metin arama | bağımlılık |
| unicode-org/icu (Node Intl) | Unicode License (NOASSERTION) | Sıralama, çoğul, biçimlendirme | bağımlılık |
| zemberek-nlp · zemberek-python · snowball · Meilisearch/Typesense | Apache-2.0 · NOASSERTION · BSD-3 · — | Türkçe morfoloji, arama motoru | elendi |
| anthropics/anthropic-sdk-typescript | MIT | Model çağrısı, yapılandırılmış çıktı | bağımlılık |
| 567-labs/instructor-js | MIT | Şema onarım turu | desen |
| SGrondin/bottleneck | MIT | Hız sınırı, kota sayacı | desen |
| sindresorhus/p-retry | MIT | Yeniden deneme | bağımlılık |
| pino · commander.js · eemeli/yaml | MIT · MIT · ISC | JSONL defter; CLI alt komutları; `rules.yaml` gidiş-dönüş | bağımlılık |
| archiverjs/node-archiver · yauzl | MIT | Zip yazma ve açma | bağımlılık |
| adm-zip · fflate | — · MIT | Zip açma | elendi |
| lovell/sharp | Apache-2.0 (ikili LGPL-3.0+) | Görsel dönüştürme | bağımlılık |
| Daninet/hash-wasm · ka-weihe/fastest-levenshtein | MIT (NOASSERTION) · MIT | Hızlı hash, düzenleme uzaklığı | elendi |
| electron-store (+ conf) · kysely-org/kysely | MIT | Kullanıcı ayarları; sorgu kurucu + göç motoru | bağımlılık |
| drizzle-team/drizzle-orm · sequelize/umzug | Apache-2.0 · MIT | ORM, göç defteri | desen |
| pmndrs/zustand · TanStack/virtual | MIT | Oturum durum makinesi; liste sanallaştırma | bağımlılık |
| TanStack/query | MIT | Sunucu durumu önbelleği | desen |
| airbnb/visx · i18next/i18next | MIT | İstatistik çizimleri; arayüz çevirisi | bağımlılık |
| recharts/recharts | MIT | İstatistik çizimleri | elendi |
| vitest · playwright · changesets | MIT · Apache-2.0 · MIT | Birim test; uçtan uca test; sürüm ve CHANGELOG | bağımlılık |
| dequelabs/axe-core | MPL-2.0 | Erişilebilirlik denetimi | desen |
| electron/update-electron-app | MIT | Otomatik güncelleme | desen |

## Lisans uyarıları

- **ankitects/anki — AGPL-3.0-or-later (API `NOASSERTION`).** Kod, SQL metni, sabit tablo veya parametre kopyalanamaz; kopyalanırsa türev iş olur ve MIT dağıtım geçersizleşir. Yalnız desen okunur, kendi kelimelerimizle yeniden yazılır. "Anki" ayrıca Ankitects markası, ürün adında kullanılmaz.
- **logseq/logseq — AGPL-3.0.** Kod alınmaz; `assets://` işleyicisi yalnız karşı-örnek olarak okunur.
- **pymupdf/PyMuPDF — AGPL-3.0 (Artifex ticari lisansı ayrı).** Electron paketine girmez. İki çıkış: dağıtılmayan iç üretim aracında kalır, ya da motor pypdfium2 + pdfplumber üstüne kurulur.
- **ArtifexSoftware/mupdf.js — AGPL-3.0.** "Node tarafına geçince lisans sorunu çözülür" yanlıştır; dışarıda bırakılır.
- **krmanik/genanki-js — AGPL-3.0 (API `NOASSERTION`).** Bağımlılık alınamaz; `.apkg` üçlü ayrımı ve medya numaralandırma sözleşmesi desen olarak alınır.
- **mnemosyne-proj/mnemosyne — AGPL-3.0 + "türev işte Mnemosyne adı görünür kalsın" ek şartı (API `NOASSERTION`).** Tek satır kod veya doğrudan şema kopyası giremez.
- **moodle/moodle — GPL-3.0.** Şema dosyası kopyalanmaz; ayrıca `TRADEMARK.txt` ile Moodle adı lisanstan bağımsız korunuyor. Kendi tablolarımızı kendimiz yazarız.
- **h5p/h5p-php-library — GPL-3.0.** İçerik tipi MIT olsa da çalıştıran çekirdek GPL; yalnız veri modeli fikri alınır, çalışma zamanı alınmaz. "H5P uyumlu" ifadesi marka koşulları okunmadan kullanılmaz.
- **GIFT (Moodle belgesi) — GPL-3.0.** Format tanımı dışa aktarma hedefi olarak kullanılır, Moodle kodu alınmaz; ayrıştırıcı referansı MIT olan GIFT-grammar-PEG.js'tir.
- **Citolab/qti-components — GPL-3.0-only.** Electron uygulamasına linklenmesi MIT dağıtımı bozar; README'nin işaret ettiği ticari çift lisans bir çözüm değil, pazarlıktır. Alınan tek şey dönüştürücü/oluşturucu ayrımı.
- **typed.js — npm'de GPL-3.0.** Daktilo efekti için alınmaz.
- **@img/sharp-libvips-\* — LGPL-3.0-or-later (libvips deposu LGPL-2.1); sharp'ın kendisi Apache-2.0.** İkili son kullanıcı paketine girerse lisans metnini iletme ve yeniden bağlamaya izin verme yükümlülüğü doğar — bu yüzden sharp yalnız quizforge CLI'da tutulur.
- **dequelabs/axe-core — MPL-2.0.** Dosya düzeyinde zayıf copyleft; ayrı npm paketi olarak MIT ürünü kirletmez ama yalnız `devDependencies`'te kalır. Kaynağında değişiklik yapılırsa değişen dosyalar MPL kalır.
- **cure53/DOMPurify — MPL-2.0 OR Apache-2.0.** İkisi de izin verici, MIT ile uyumlu; Apache-2.0 seçilirse bildirim yükümlülüğü doğar. Bugünkü boru hattında kullanılmıyor.
- **CaviraOSS/PageLM — "PageLM Community License", OSI onaylı değil, ticari ve gelir getiren her kullanım açıkça yasak, lisans "revocable".** Satır alınmaz, yalnız desen okunur.
- **facebookresearch/nougat — kod MIT, ağırlıklar CC-BY-NC.** Ticari kullanım yasak; Quizloop ücretli olursa ihlal. Bağımlılık yapılmaz.
- **datalab-to/marker — kod Apache-2.0, ağırlıklar değiştirilmiş AI Pubs OpenRAIL-M.** OSI onaylı değil, 5M USD üstü gelir/fonda ticari lisans gerekiyor. Yedek/ikinci geçişle sınırlı tutulur.
- **open-spaced-repetition/srs-benchmark — lisans yok (`license: null`, `LICENSE` dosyası yok).** Lisanssız depo "tüm hakları saklı"dır: kod, parametre listesi veya `result/` çıktısı taşınamaz; okumak ve atıf vermek serbest.
- **1EdTech/qti-examples — lisans dosyası yok, yalnız NOTICE.** Referans olarak okunur, kopyalanmaz.
- **fbellame/pdf-to-quizz — lisanssız.** Elendi.
- **atlanhq/camelot — NOASSERTION, arşivli.** Dağıtılan üründe lisans belirsizliği tek başına eleme sebebi; bakımlı çatal camelot-dev/camelot (MIT) kullanılır.
- **litellm, inngest, loodos/zemberek-python — NOASSERTION.** Üçü de elendi.
- **QTI 3.0 spesifikasyonu — 1EdTech telifi, açık erişim ama OSI lisansı değil.** Yalnız okunacak referans; XML'i iç format yapılmaz.
- **NOASSERTION dönen ama sorunsuz olanlar** (kayıt için): sqlite public domain, unicode-org/icu Unicode License, sinclairzx81/typebox MIT, vercel/streamdown Apache-2.0, Daninet/hash-wasm MIT — API alanı yanıltıcı, LICENSE dosyası temiz.

## Seçilen yığın

- **Ana süreç:** electron, better-sqlite3 (12.x pinli), @electron/rebuild, electron-store (+ conf), kysely (koşullu), ts-fsrs, zod, sqlite FTS5.
- **Renderer:** react-markdown, KaTeX, tinykeys, react-aria (`focus`, `live-announcer`, `visually-hidden`), zustand, @tanstack/react-virtual, visx (`heatmap`, `shape`, `scale`, `axis`, `group`, `responsive`), i18next.
- **quizforge CLI:** @anthropic-ai/sdk, commander, yaml (eemeli), p-retry, pino, archiver, yauzl, sharp; Python yan sürecinde docling + pdfplumber + pypdfium2 + camelot.
- **Yalnız geliştirme:** electron-vite, electron-builder, vitest, playwright, changesets, axe-core, electronegativity (tek seferlik denetim).

## Karara bağlananlar

- Şema sıfırdan yazılır, Anki'den yalnız kavram alınır; hiçbir satır kopyalanmaz. Filtreli deste, senkronizasyon sütunları ve JSON gömülü yapılandırma kapsam dışı.
- `reviews` / revlog tablosu birinci sürümde tam alanlarla açılır — geriye dönük doldurulamaz; satır sonradan güncellenmez, düzeltme ters kayıtla yazılır.
- Zamanlama `ts-fsrs` ile, `srs` katmanının arkasında; FSRS motoru kendimiz yazmayız. Üç seçenekli öz-değerlendirme ile şık denemesi Again/Hard/Good'a eşlenir, Easy üretilmez.
- `desired_retention` 0,9'da sabitlenir, v1'de ayar olarak açılmaz; optimizer v1'de kurulmaz.
- İçerik hash'i birincil anahtar yapılmaz: soru `id`'si kalıcı, `icerik_hash` ayrı alan. Silinen soru `arsiv` işaretlenir, günlüğü kalır.
- Pencere ayarı `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity` her ortamda açık.
- Varlıklar `quizloop-asset://` özel şemasıyla, `protocol.handle` + `net.fetch` ve kök içinde kalma kontrolüyle servis edilir; `file://`, data URI ve `bypassCSP` yok.
- İskelet `electron-vite@^5` + `electron-builder@^26`; Forge kullanılmaz. CI üç-OS matrisi, çapraz derleme yok; macOS sertifika alınana kadar bilinçli imzasız.
- `better-sqlite3` 12.x pinlenir ve `dependencies` altında durur; rebuild yalnız electron-builder faz 2a'da koşar, postinstall'da electron-rebuild yoktur.
- Zod v4 tek şema kaynağı; modele giden JSON Schema `z.toJSONSchema` ile türetilir, ajv şimdilik kurulmaz. Blok tipleri `z.discriminatedUnion("type", …)`, modül JSON'unda `schemaVersion`.
- İç format kendimizin; dışa aktarma sırası GIFT → Moodle XML → `.apkg`. `Option.rationale` zorunlu alan, genel çözüm anlatımı ayrı alan.
- Oturum kaydı append-only adım günlüğü; skor türetilir, saklanmaz.
- Modül paketi zip = `module.json` + `questions.json` + `media/`; açmada yol ve uzantı denetimi zorunlu, METADATA whitelist olarak kullanılır. İlerleme içerik dosyasının dışında, kalıcı id ile bağlı; güncelleme id eşleşmesiyle merge edilir.
- Arama için tek `fold(tr)` fonksiyonu + ayrı `search_text` sütunu + FTS5 `unicode61`, geniş arama için ikinci `trigram` indeksi; sıralama JS'te `Intl.Collator('tr')` ile.
- Typer hedef/görünen metin + rAF + `minCommitMs`; formül KaTeX, MathJax alınmaz. `prefers-reduced-motion` tek merkezi kanca ve açık ayarı ezer; animasyonlu metin `aria-hidden`.
- Kısayollar tek `shortcuts.ts` haritasından üretilir; yeniden atama v1'de yok.
- PDF çıkarma ayrı Python yan süreci — süreç sınırı hem bellek hem lisans sınırıdır. Bölüm sınırları `/Outlines` ağacından deterministik türetilir, AI'ya sorulmaz. Tablo kabulü metrik eşiğine bağlı; eşiği geçmeyen bölge kırpılmış görsel olarak basılır.
- Üretim hattı append-only JSONL ledger + temp/fsync/rename snapshot; iş kimliği içerik hash'i, kısmi başarı parça düzeyinde, deneme tavanlı. Yeniden deneme tek yerde toplanır, SDK'nın HTTP denemesiyle üst üste binmez.
- Onarım katmanı biçim düzeltir, içerik uydurmaz — eksik alan hatadır. Çeldiriciyi LLM üretir, kod eler. Önce alıntı sonra soru; chunk'a dosya + sayfa metadatası doğduğu anda iliştirilir.
- Ayarlar `settings.json`'da, ilerleme `progress.sqlite`'ta; electron-store `migrations` kullanılmaz, `clearInvalidConfig: true` + kullanıcıya bildirim.
- Otomatik güncelleme: v1'de macOS'ta pasif bildirim, Windows'ta gerçek güncelleme, Linux'ta indirme bağlantısı. İmzasız macOS için otomatik güncelleme hiçbir modülle mümkün değil.

## Açık kalanlar

- **ts-fsrs kararında çelişki:** `fsrs.md` ve `anki-cekirdek.md` ts-fsrs'i doğrudan bağımlılık alıyor; `ilerleme-semasi.md` "ts-fsrs'i şimdi bağımlılık almak" maddesini kaçınılacaklar arasına koyup ihtiyacın üç seviyeli SM-2/Leitner olduğunu söylüyor. Çözülmedi.
- **PLAN.md ile `pdfjs.md` çelişiyor:** PLAN.md `pdfjs-dist`'i "`/Outlines` çıkarımında zayıf" diye elemiş; tarama `getOutline`'ın birinci sınıf API olduğunu, gerekçenin "ikinci motor maliyeti" olarak düzeltilmesi gerektiğini yazıyor.
- 401 MB / 1468 sayfalık dosyada bellek davranışı için hiçbir birincil ölçüm yok (pdf-cikarma.md); pdf-lib'in aynı boyuttaki davranışı da ölçülmedi (pdf-lib.md).
- Node/Electron için AGPL'siz, saf JS, konumlu gömülü görsel çıkaran olgun kütüphane bulunamadı; pdf.js operatör listesi yolu denenmedi (pdf-cikarma.md).
- Camelot `ml` backend'inin TEDS iddiası ve bizim veriye aktarılabilirliği (pdf-cikarma.md).
- marker ile docling'in tablo/formül kalite kıyası — her iki benchmark deponun kendi ölçümü; marker v2'nin Windows kurulum maliyeti de ölçülmedi (pdf-llm-hatti.md).
- KaTeX'te `ı`, `ğ`, `ş` için dikey hizanın bozulup bozulmadığı (icerik-render.md).
- "FSRS varsayılan parametreler bile SM-2'den iyidir" iddiası ve kullanılmayan derecenin `parameter_clipper.rs` davranışı (fsrs.md); srs-benchmark tablosu koşturulup doğrulanmadı (srs-benchmark.md).
- Anki çekirdeğinde kısayol yeniden atama arayüzü bulunamadı; tinykeys'in gerçek gzip boyutu belirsiz — "~650 B"/"~1KB" iddiaları npm `unpackedSize` 76 KB ile çelişiyor (erisilebilirlik.md).
- Doyensec'in BlackHat 2017 tarama isabet/kapsam oranları (electron-guvenlik.md).
- Apple Developer Program yıllık ücreti resmî sayfadan doğrulanmadı (electron-iskelet.md); `update.electronjs.org` için çalışma süresi taahhüdü bulunamadı (update-electron-app.md).
- Playwright `_electron` için tarayıcı ikiliklerinin gerekip gerekmediği (playwright.md); Vitest'te threads havuzunda native modülün kırıldığı iddiası (vitest.md).
- obsidian-spaced-repetition'ın 328 açık issue'sunun depolama yaklaşımından kaynaklandığı — yalnız sayı doğrulandı (anki-cekirdek.md); Incrementum'un FSRS-6/SM-18/SM-20 desteği (srs-masaustu.md).
- Taranan soru üretim projelerinin hiçbirinde doğrulanabilir başarı/doğruluk ölçümü yok (llm-soru-uretimi.md); genanki-js ile üretilen paketin güncel Anki'de açıldığı (genanki-js.md); QTI dışa aktarmanın kullanıcıya değer üreteceği (qti-components.md).
- Kendi ölçümü olan ve bağımsız doğrulanmayan iddialar: axe-core "%57 otomatik bulunur" (axe-core.md), fastest-levenshtein "en hızlı" (fastest-levenshtein.md), hash-wasm'ın node:crypto'ya karşı kazancı (hash-wasm.md), TypeBox'ın AJV8 tablosu (sema-dogrulama.md).
- recharts alt bağımlılıklarının lisansları tek tek doğrulanmadı (recharts.md); visx `sizes.json` ölçümünün sıkıştırılmış mı ham mı olduğu (visx.md); TanStack Virtual'da uzak indekse `scrollToIndex` ofset kayması (tanstack-virtual.md); react-markdown'ın bakım hızı (react-markdown.md).
- changesets'in ürettiği etiket biçimi `v1.2.3` mü `ad@1.2.3` mü (changesets.md); pino'da `sync: false` ile süreç çıkışında `flushSync()` deseni (pino.md).
- quizforge'un hedef Node sürümü doğrulanmadı — commander v15, p-retry v8, kysely 0.29 ve archiver 8 sürüm seçimleri buna bağlı. Quizloop'un TypeScript sürümü de doğrulanmadı; eemeli/yaml TS 5.9 alt sınırı istiyor. sharp'ın Electron gömülü Node sürümüyle Node-API uyumu doğrulanmadı.
- Anki markasının ayrıca korunduğu bilgisi (soru-formatlari.md) ve H5P marka koşulları (quiz-uygulamalari.md) doğrulanamadı.

## Karşı-örnekler

- **`file://` kullanma** — sayfa makinedeki her dosyaya erişir, XSS doğrudan dosya sızmasına döner (electron-guvenlik.md). **Logseq'in `assets://` işleyicisini örnek alma** — kök içinde kalma kontrolü yok, şema `bypassCSP: true` ile kayıtlı. **`ipcRenderer`'ı veya callback'i contextBridge'den geçirme** — tüm IPC sistemi açılır; `@electron/remote` de aynı sebeple yasak. **`sandbox: false`'ı normalleştirme** — sonradan açmak preload'daki Node kullanımını kırar.
- **Zip'i doğrulamadan hedef dizine açma** — Mnemosyne'in atladığı yer, yol gezinme ve üzerine yazma riski (srs-masaustu.md); `adm-zip` iki güvenlik danışmasıyla elendi (archiver.md).
- **İlerlemeyi içerik dosyasına gömme** — dosya AI ile yeniden üretilince ilerleme de silinir (srs-masaustu.md). **Kart tipini eklentiye bağlama** — eksik tip içe aktarımı komple düşürüyor; bilinmeyen alan uyarıyla yok sayılmalı (srs-masaustu.md).
- **Sessiz uydurma onarım** — PageLM `cleanOptions` eksik şıkları "Option 1" diye dolduruyor, geçersiz `correct`'i 1'e sabitliyor; geçerli görünen, içi boş soru üretir. **`json_object`'i şema zorlaması sanma** — alan varlığını garanti etmez (llm-soru-uretimi.md).
- **HTML string saklama** — Electron'da XSS yüzeyi, blok tabanlı çözüm oynatmayı imkânsızlaştırır (quiz-uygulamalari.md). **`rehype-raw` ekleme** — güvenlik yüzeyi tek eklentiyle iki katına çıkar (react-markdown.md).
- **Daktilo metnini `aria-live` bölgesine koyma** — her karakterde bildirim ekran okuyucuda kesik gürültü olur (icerik-render.md). **Akan içeriği sanallaştırma** — ResizeObserver her karakterde yeniden ölçüm tetikler (tanstack-virtual.md).
- **Tek büyük JSON'u her yazımda baştan yazma** ve **sıra numarasıyla ilerleme takibi** — parçalar sırayla bitmez, tek imleç bunu temsil edemez (dayanikli-hat.md). **Kuyruğu her cevapta yeniden kurma** — modül sayısı büyüdüğünde çalışmaz (anki-cekirdek.md).
- **`reviews` satırını sonradan güncelleme**, **içerik hash'ini birincil anahtar yapma** (tek harflik düzeltme kartı sıfırlar) ve **CrowdAnki'nin "içe aktarımda üzerine yaz" varsayılanı** — kullanıcının yerel düzenlemesi sessizce silinir (ilerleme-semasi.md).
- **SQLite `lower()`/`upper()`/`LIKE`'ı Türkçe için kullanma** ve **JS'te locale'siz `toLowerCase()`** — `'İSTANBUL'.toLowerCase()` araya U+0307 sokar. **Ham metni normalize edip saklama** — NFKD geri döndürülemez. **PDF metnini temizlemeden indeksleme** — tire, ligatür ve sert boşluk token'ı böler (turkce-metin.md).
- **Tabloyu "çözülmüş veri" sanma** — ruled olmayan ve sayfa aşan tablolarda sessizce yanlış üretilir (pdf-cikarma.md). **Her sayfayı VLM'e sokma** ve **README benchmark'ına dayanarak seçim** (pdf-llm-hatti.md).
- **Tek makineden üç platform üretme** — native bağımlılık hedef platformda derlenmeli. **Saf-JS geri düşüş yazma (sql.js / libsql)** — iki SQL kod yolu, iki test matrisi (yerel-modul-paketleme.md).
- **Store kökünü doğrudan ayrıştırıcı birleşim yapma** ve **`persist` ile oturum durumunu diske yazma** — ikinci doğruluk kaynağı yaratır (zustand.md). **TanStack Query varsayılanlarını olduğu gibi kabul etme** — pencere odağında gereksiz SQLite okuması, deterministik IPC hatasında üç kez retry (tanstack-query.md).
- **p-retry varsayılanlarını olduğu gibi alma** (10 deneme, tavansız `maxTimeout`) ve **iki retry katmanını üst üste bindirme** — birim başına 6 HTTP isteği (p-retry.md).
- **`encryptionKey`'i güvenlik sanma** ve **electron-store `migrations`'a yaslanma** — bakımcının kendi uyarısı var (electron-store.md). **`drizzle-kit`'i paketlenmiş uygulamada çalıştırmayı bekleme** — `meta/_journal.json` diskten okunur (drizzle-orm.md). **Göçü transaction dışında koşma** (umzug.md).
- **Kullanıcı ilerlemesini log akışından türetme** — defter makineye, ilerleme arayüze ait (pino.md). **Kısayolları başlangıçta yeniden atanabilir yapma** ve **`prefers-reduced-motion`'ı yalnız CSS'e bırakma** (erisilebilirlik.md).
- **Kapsam şişmesi** — Incrementum 8 ayda OCR, TTS, bilgi grafiği, 146 tema doldurmuş; **imzasız dağıtımı belgeyle geçiştirme** — ilk çalıştırmada kaybedilen kullanıcı (srs-masaustu.md).

## Bakımsız depolar

| Depo | Son işaret |
| --- | --- |
| electron-react-boilerplate | son etiketli sürüm v4.6.0, 2022-05-15 |
| doyensec/electronegativity | son sürüm v1.10.0, 2022-12-07; README "artık aktif geliştirmiyoruz" |
| samuelmeuli/action-electron-builder | arşivli, son push 2024-05-26, son sürüm 2020-06-18 |
| SGrondin/bottleneck | son sürüm 2019-08-03, ana dalda son commit 2020-07-21 |
| Hopding/pdf-lib | `master` son commit 2021-11-12, son etiket v1.17.1 (2021-11-06) |
| krmanik/genanki-js | son sürüm v1.0.5 (2021-09-17), son push 2023-03-12 |
| ramsrigouthamg/Questgen.ai | son push 2023-12-08, etiketli sürüm yok |
| atlanhq/camelot | arşivli, son push 2023-01-05, son etiket v0.7.2 (2019) |
| Stvad/CrowdAnki | son etiket v0.9.5, 2023-10-30 (~2,5 yıl etiketsiz) |
| mnemosyne-proj/mnemosyne | son etiketli sürüm 2.11, 2023-11-12 |
| facebookresearch/nougat | son sürüm 0.1.0-base, 2023-08-22 |
| ahmetaa/zemberek-nlp | etiket/release yok; README "0.17.1, July 2019", yavaş bakım kipi |
| ECuiDev/obsidian-quiz-generator | son sürüm 2.1.2 (2024-10-25), son commit 2024-11-13 |
| Daninet/hash-wasm | son sürüm ve son commit 2024-11-19 |
| prebuild/prebuildify | son push 2024-06-14, GitHub sürümü yok; prebuild-install arşivli |
| ka-weihe/fastest-levenshtein | son etiket 1.0.15 (2022-08-02), son commit 2024-01-28 |
| 567-labs/instructor-js | son sürüm ve son commit 2025-01-27 |
| bonartm/quizdown-js | arşivli, son sürüm v0.6.0 (2022-09-07) |
| amp-up-io/qti3-item-player | son push 2025-06-21, etiketli sürüm yok |
| remarkjs/react-markdown | son etiket 10.1.0 (2025-03-07), son push 2025-04-21 |
| pacocoursey/cmdk | `dip/cmdk`'ya taşınmış, son sürüm v1.1.1 (2025-03-14) |
| sindresorhus/electron-store | son etiketli sürüm v11.0.2 (2025-10-05), 77 açık issue |
