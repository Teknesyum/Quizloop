# 0038 — Açık Lisanslı Modüller Uygulamaya Gömülür, Play Üretime Çıkar

Tarih: 2026-10-21. Örnek modül düzenini (resources/ornek) kaldırır; 0023'teki "İngilizce
yayımlanmaz" kararını yalnız açık lisanslı bir alt küme için değiştirir.

## Sahibin Sözü

"Örnek modülleri kaldıralım, İngilizce ve Arapça modüllerini varsayılan ilk modüller olarak
kuralım. Yapamıyorsak lisanssız lite versiyonlarını oluşturalım. Genel Kültür de varsayılan
kurulsun, çok daha kapsamlı sorularla."

## Karar

- İlk açılışta üç modül gömülü kurulur: Arapça, İngilizce Lite, Genel Kültür. Kaynak
  `resources/varsayilan/`; üretim `npm run ornek` (Genel Kültür) ve `npm run varsayilan`
  (Arapça, İngilizce Lite).
- Uygulama rehberi örnek modülü kaldırıldı.
- **Arapça:** kaynakları CC BY-SA 4.0. Gömülü kopyanın `source.title` alanı lisans adını,
  bağlantısını ve atfı (Wiktionary, Vikisözlük katkıcıları, Kaikki.org, FrequencyWords)
  taşır.
- **İngilizce Lite:** CEFR-J'den gelen her kart ve kural çıkarılır; yalnız Octanove
  (CC BY-SA 4.0), Open English WordNet (CC BY 4.0), Wiktionary (CC BY-SA 4.0), ipa-dict (MIT)
  kalır. Betik çıktıda CEFR-J izi görürse durur. Tam İngilizce modülü yayımlanmaz (0023).
- AGENTS.md'deki "gerçek modül commit edilmez" kuralı telifli kaynaktan türeyen modüller
  içindir; açık lisanslı ve kendi yazdığımız modüller depoya girebilir.
- Play yüklemesi kapalı test yerine üretim izine gider (`track: production`). Paylaş metni
  Play bağlantısını taşır.

## Sonuç

İngilizce Lite yalnız C1–C2 kelime ve 62 kuraldan oluşur; başlangıç düzeyi için açık
lisanslı bir sıklık listesinden yeni sözcük listesi İngilizce oturumunun işidir.
Antimikrobiyal, yoğun bakım ve anestezi modülleri telifli kaynaktan türer, gömülmez.
