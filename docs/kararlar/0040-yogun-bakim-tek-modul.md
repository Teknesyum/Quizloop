# 0040 — Yoğun Bakım Tek Modül, İki Alt Dal

- tarih: 2026-10-24
- durum: kabul
- değiştirdiği: 0039 §1 ve §6

Sahibin cümlesi (kitap adı 0032 gereği çıkarıldı): "yoğun bakım modülü tek modül olacak 3 farklı
ybü açmışsın [kitap] ve senin araştırmalarınla hem teorik hem klinik vakaları soran eğiten bir
modül oluşturalım istedim onları da teke birleştir modülün alt dalında bu ayrım olacak".

## Kararlar

1. Tek modül kurulur: `yogun-bakim` — "Yoğun Bakım". `temel-yogun-bakim`, `yogun-bakim-temel` ve
   `yogun-bakim-vaka` bu modülde birleşir; üçü ayrı paket olarak yayınlanmaz.
2. Modülün iki alt dalı vardır: **Teorik** (öğretir: Anlat anlatımı, kısa bilgi sorusu) ve
   **Klinik Vaka** (vizit sesinde zincirli vaka, standart vaka başlığı).
3. Alt dal bölüm adının önekidir: `"Teorik › 09 Sepsis"`, `"Klinik Vaka › 09 Sepsis"`
   (standart 1.3.0 §2). Uygulama iki ya da daha çok dal görünce Bölümler ekranında dal
   seçicisi gösterir; veritabanı, oturum ve hedef bölüm adına bağlı kalır.
4. Eski `temel-yogun-bakim` paketinin 343 sorusu standart 1.3.0'a getirilerek Teorik dala
   alınır; kitap sayfasına bağlanamayan soru alınmaz. Mevcut kartların ilerlemesi taşınmaz.
5. 0039'un kaynak, kılavuz, güncellik ve gizlilik kararları (§2–§5, §7, §8) aynen geçerlidir.

## Ajanın Yorumu (Sahibin Cümlesi Değil)

- Birleştirme modül oturumunun işidir; bu oturum yalnızca dal seçicisini ve standardı verir.
- Dal öneki, sütun eklemeden aynı bölüm adı anahtarını korumak için seçildi: göç yok, IPC değişmez.
