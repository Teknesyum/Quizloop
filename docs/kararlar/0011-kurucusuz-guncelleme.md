# 0011 — Güncelleme Kurucu Çalıştırmaz, Kod Paketi İndirir

Tarih: 2026-10-04. İnceleme: `docs/danisma/004-guncelleme-sistemi-incelemesi.md`.
Sahibin sözü: "kurucusuz güncelleme bizim temel prensibimiz olacak, kurucu da olacak ancak
sadece ilk kurulum için geçerli."

**Karar.** Kurucu (NSIS) yalnızca ilk kurulum içindir. Olağan sürüm, uygulamanın kendi
indirdiği küçük bir kod paketiyle gelir; kurulum penceresi açılmaz, dosyalar Program
klasöründe yeniden yazılmaz.

## Parçalar

- **Kabuk:** Electron, `node_modules`, `electron-builder.yml`. Kurucuyla gelir.
- **Kod:** `out/main`, `out/preload`, `out/renderer`, `resources`. Paketle gelir (~2,6 MB).
- **Kabuk anahtarı** (`scripts/kabuk.ts`): Electron sürümü, `package-lock.json`'daki üretim
  bağımlılıkları ve `electron-builder.yml`'in özeti. Derlemede `__KABUK__` olarak koda gömülür.
- **Yayın:** `npm run kod` → `dist/kod-<sürüm>.zip` ve `dist/kod.json`
  (`version`, `kabuk`, `file`, `sha512`, `size`). Sürüm iş akışı Windows işinde üretir.

## Akış

1. `update.ts` son sürümün `kod.json`'unu okur. Sürüm yeniyse ve kabuk anahtarı aynıysa kod
   yolu seçilir; değilse eski yol (sessiz NSIS) çalışır.
2. `kod.ts` paketi indirir, boyutu ve SHA-512 özetini doğrular, `userData/kod/<sürüm>/`
   altına açar, `durum.json`'a yazar. Yalnızca `out/` ve `resources/` yolları kabul edilir.
3. `boot.ts` (paketin `main` girişi) açılışta `durum.json`'a bakar. Paket kurulu koddan
   yeniyse ve kabuk anahtarı tutuyorsa onu yükler; yoksa kurulu `index.js`'i.
4. Rozetteki "Uygula" yeniden başlatır (`app.relaunch`). Basılmazsa yeni kod sonraki
   açılışta devreye girer.

## Güvenlik Ağı

- Her açılış `tries` sayacını bir artırır; pencere yüklenince sıfırlanır. İki açılışta pencere
  gelmezse ya da kod yüklenirken hata atarsa uygulama kurulu koda döner.
- Başarısız paket işaretli kalır; aynı sürüm yeniden indirilmez, o sürüm kurucuyla gelir.
- Paket indirilemez ya da doğrulanamazsa aynı denetimde kurucu yoluna düşülür.
- Kurucu daha yeni bir sürüm kurduğunda `userData/kod/` temizlenir.

## Sınırlar

- Şimdilik yalnızca Windows. macOS ve Linux bildirimle kalır; aynı düzen oraya da taşınabilir.
- Android bu kararın dışında: Play kod indirmeyi yasaklar.
- Electron ya da yerel bağımlılık değişen sürüm kurucuyla gelir; sürüm notunda yazılır.
- Paket GitHub sürümünden HTTPS ile gelir; özet aynı kaynaktan okunur. Uygulama imzasız
  olduğu için bu, kurucu yolundan zayıf değildir.
- Windows "Uygulamalar" listesi kabuğun sürümünü gösterir; uygulamanın kendi gösterdiği sürüm
  doğrudur.
- `QUIZLOOP_KOD_URL` yalnızca `http://127.0.0.1:<port>` biçimindeyse dikkate alınır; yerel
  deneme içindir.

## Deneme (2026-10-04)

`dist/win-unpacked` + yerel sunucu, sahte 0.9.9 paketi: indirildi, doğrulandı, yeniden
başlatmada `userData/kod/0.9.9` kodundan açıldı, sürüm 0.9.9 göründü, `tries` 0'a döndü.
`index.js` bozulunca uygulama kurulu 0.7.8 koduyla açıldı ve paket `tries: 2` ile işaretlendi.
