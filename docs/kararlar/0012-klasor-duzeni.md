# 0012 — Klasör Düzeni: Her Çıktı `dist/` Altında, Kökte Başıboş Dosya Yok

Tarih: 2026-10-04. Sahibin sözü: "proje klasörlerimize bi düzen ver, niye dist, modules
içinde biri, biri başka yerde."

**Karar.** Derleme çıktısı üç ayrı kök klasöre (`dist/`, `dist-android/`, `dist-modules/`)
dağılmaz; hepsi `dist/` altında durur. Kökte yalnızca kaynak, ayar ve belge kalır.

## Kök

| Klasör | İçinde Ne Var | Depoda mı |
|---|---|---|
| `src/` | Uygulama kodu (`core`, `main`, `preload`, `renderer`, `android`, `shared`) | Evet |
| `android/` | Capacitor'ın Android projesi | Evet |
| `tools/quizforge/` | Modül üretim aracı | Evet |
| `scripts/` | Derleme ve yayın betikleri | Evet |
| `locale/`, `schema/`, `teknesyum-ui/` | Çeviri, üretilmiş şema, arayüz kiti | Evet |
| `docs/` | Plan, kararlar, danışma kayıtları, ölçümler | Evet |
| `build/` | Kurucunun simgeleri (electron-builder okur) | Evet |
| `resources/` | Uygulamanın çalışırken kullandığı simge | Evet |
| `assets/` | README rozetleri | Evet |
| `database/` | Ham kaynak kitaplar (telifli) | Hayır |
| `sources/` | Modül başına çalışma verisi; yalnızca kural dosyaları depoda | Kısmen |
| `modules/` | Üretilmiş modüller; yalnızca `_ornek/` depoda | Kısmen |
| `out/` | Derlenmiş kod (ara ürün) | Hayır |
| `dist/` | Dağıtılacak her şey | Hayır |
| `tmp/`, `trash/` | Geçici dosya (1 gün) ve bitmiş dosya (1 hafta) | Hayır |

İçerik hattı sırayla okunur: `database/` → `sources/` → `modules/` → `dist/modules/`.

## `dist/`

- `dist/desktop/` — kurucular, `latest*.yml`, kod paketi (`kod-<sürüm>.zip`, `kod.json`).
- `dist/android/` — APK ve AAB.
- `dist/modules/` — `.qlmod` paketleri.

Masaüstü çıktı yolu `electron-builder.yml`'e değil npm betiklerine yazıldı
(`-c.directories.output=dist/desktop`): o dosya kabuk anahtarına girer (karar 0011),
değişseydi sıradaki sürüm kurucuyla gelirdi.

## Taşınanlar

- `dist-android/` → `dist/android/`, `dist-modules/` → `dist/modules/`.
- `.tmp-olgu/` (depoya girmiş geçici klasör) → `docs/danisma/000-oturum-ekrani*.md`.
- `.eslintcache` → `node_modules/.cache/eslint/`. Bayat `*.tsbuildinfo` silindi.

## Kural

Yeni bir çıktı türü `dist/<ad>/` altına yazılır. Köke yeni klasör açmak karar kaydı ister.
