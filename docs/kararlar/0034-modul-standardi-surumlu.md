# 0034 — Modül Standardı Sürüm Taşır

Tarih: 2026-10-18.

## Sahibin Sözü

"Anlat butonuna basıldığında ne anlatılacağı, nereden, ne görsel basılacağı modül kısmına
gömülecek ve dediğim sistem modül standartlarına yazılacak. Modül standartlarında da artık
sürüm olacak; modül oluşturan oturuma modülü standartlara göre güncelle demem yeterli olacak."

Ve görseller için: "Ham PDF zaten gömülü; resimlerin adreslerini gömsek, uygulama PDF'in o
kısmını bassa boyut kazanırız. Kaynak PDF'i gömülü olmayan istisnaları gömmek yeterli."

## Karar

1. Modül kuralları tek belgede toplanır: `docs/modul-standardi.md`. Belge üç parçalı sürüm
   taşır, her değişiklik sürüm geçmişine girer.
2. Modül uyduğu sürümü `module.json` içinde `standart` alanıyla söyler (şemada isteğe bağlı).
3. Anlatım kavram başına yazılır ve kaynağını `sayfa` bloğuyla gösterir. Dil modüllerindeki
   "ders anlatımı yok" kuralı ayrı ders ekranını yasaklar, soru içi anlatımı yasaklamaz.
4. Kitaptan alınan görsel `bolge: { pdfSayfa, bbox }` kaydeder (şemada isteğe bağlı). Görsel
   uygulama PDF'ten çizmeye başlayana dek pakette kalır; o gün standart 1.1.0 olur.

## Neden Hemen Silinmiyor

Uygulama bugün görseli yalnızca dosyadan gösteriyor. Görsel önce silinirse eski uygulamada
soru resimsiz kalır. Bölge kaydı önce girer, çizim uygulamaya gelince görsel çıkar.

## Ölçüm

En büyük kitaplı modül 680 MB: bölüm PDF'leri 407 MB, soru görselleri 217 MB (564 PNG, hepsi
kullanılıyor), kaynak kesitleri 52 MB (3760 dosya, hiçbir soru başvurmuyor). Öteki beş modülde
görsel toplamı 1 MB'ın altında.
