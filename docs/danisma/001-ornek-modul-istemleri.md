# 001 — Örnek Modül İçeriği: Ajanlara Verilen İstemler

Tarih: 2026-10-04. İki alt ajana verilen iş tanımı. Çıktıları `scripts/ornek/` altındaki
iki JSON dosyasıdır; `npm run ornek` onları doğrulayıp `resources/ornek/` altına modül
olarak yazar.

## Ortak Biçim

Tek bir JSON dosyası yaz. Başka dosyaya dokunma, kod yazma, komut çalıştırma.

```json
{
  "sections": [
    { "page": 1, "chapter": "Bölüm Adı", "text": "Kaynak not metni, düz paragraf." }
  ],
  "questions": [
    {
      "chapter": "Bölüm Adı",
      "page": 1,
      "difficulty": "kolay",
      "concept": "kisa-kebab-kimlik",
      "stem": "Soru metni?",
      "choices": ["DOĞRU cevap", "yanlış 1", "yanlış 2", "yanlış 3"],
      "why": ["yanlış 1 neden yanlış", "yanlış 2 neden yanlış", "yanlış 3 neden yanlış"],
      "solution": "Doğru cevabın bir iki cümlelik açıklaması.",
      "hint": "İsteğe bağlı kısa ipucu.",
      "quote": "sections içindeki o sayfanın metninden HARFİ HARFİNE alınmış bir cümle",
      "tags": ["kucuk-harf-etiket"]
    }
  ]
}
```

Kurallar:

- `choices[0]` her zaman doğru cevaptır; betik şıkları sonra karıştırır. `why` yanlış
  şıklarla aynı sırada, şık sayısından bir eksik.
- `quote`, aynı `page` numaralı `sections` kaydının `text` alanında birebir geçmelidir
  (betik bunu denetler, tutmazsa modül üretilmez). Bu yüzden önce notu yaz, sonra soruyu.
- `difficulty`: `kolay`, `orta` ya da `zor`. `concept` her soruda farklı, küçük harf ve tire.
- `tags`: küçük harf, rakam, tire; Türkçe harf olabilir; boşluk yok.
- Metinlerde şık harfi (A, B, "yukarıdakilerden hangisi" gibi sıraya bağlı ifade) geçmesin.
- "Hepsi", "hiçbiri" şıkkı yok. Şıklar benzer uzunlukta olsun; doğru cevap en uzunu olmasın.
- Dil: sade Türkçe, kısa cümle. Markdown yalnızca `**kalın**` ve `` `kod` ``.
- İş bitince tek satır rapor ver: dosya yolu, bölüm ve soru sayısı.

## İstem 1 — Rehber Modülü (`scripts/ornek/rehber.json`)

Amaç: Uygulamayı ilk kez açan birine QuizLoop'u soru çözdürerek öğretmek. İnsanlar "modül
dosyası nedir, nereden gelir, nasıl eklenir" diye soruyor; içerik bunu en baştan, hiçbir
şey bilmeyen birine anlatır gibi açıklamalı.

Olguları uydurma; şu dosyalardan çıkar: `locale/tr.json` (ekrandaki bütün yazılar),
`README.tr.md`, `docs/PLAN.md` (yalnızca kullanıcıya görünen davranış), `PRIVACY.md`,
`src/renderer/src/screens/*.tsx` (kısayollar ve akış). Emin olamadığın şeyi yazma.

Dört bölüm, her birinde 10 soru (toplam 40), her bölüm için 3-4 `sections` kaydı
(her kayıt bir "sayfa", 80-160 kelime):

1. `Modül Nedir, Nasıl Eklenir` — modül = soru paketi; `.qlmod` dosyası; dosya seçme,
   sürükleyip bırakma, çift tıklama; klasörden kurma; örnek modüller; güncelleme,
   kaldırma, sıfırlama; modüllerin uygulamadan ayrı dağıtıldığı.
2. `Oturum Nasıl İşler` — oturuma başlama, bölüm seçme, karışık; soru, şık, çözüm ve
   "neden yanlış" açıklamaları; puanlama düğmeleri; klavye kısayolları; kaynak alıntısı;
   soruyu işaretleme (bayrak); oturum özeti.
3. `Aralıklı Tekrar` — unutma eğrisi düşüncesi; karttaki dört sayı (bugün sırada, yeni,
   öğreniliyor, emekli); bir sorunun neden yarın ya da on gün sonra geldiği; gün
   başlangıcı saati; oturum başına soru sınırı; yüzde göstergesi.
4. `Ayarlar, İstatistik ve Taşıma` — arayüz boyutu, dil, yazı akışı; istatistik ekranı;
   taşıma paketi; güncellemeler; verinin cihazda kaldığı; telefon sürümü.

Beş şık (`choices` 5 öğe, `why` 4 öğe). Zorluk dağılımı bölüm başına kabaca 5 kolay,
4 orta, 1 zor. Etiketler: `rehber` ve bölüme uygun bir etiket.

## İstem 2 — Genel Kültür Modülü (`scripts/ornek/genel-kultur.json`)

Amaç: Bilgi yarışması tadında, kolaydan zora giden özgün bir genel kültür modülü.
Herhangi bir televizyon yarışmasının sorularını ya da adını kullanma; sorular senin
yazdığın özgün sorular olacak.

Üç bölüm, her birinde 15 soru (toplam 45): `Kolay Sorular`, `Orta Sorular`,
`Zor Sorular`. `difficulty` bölümle aynı (`kolay`, `orta`, `zor`).

Dört şık (`choices` 4 öğe, `why` 3 öğe). Konular karışık: coğrafya, tarih, bilim, edebiyat,
sanat, spor, dil, gündelik hayat; Türkiye ve dünya dengeli. Etiket olarak `genel-kültür`
ve konu etiketi (`coğrafya`, `tarih`, `bilim` vb.).

Olgu kuralları:

- Yalnızca kesin ve zamanla değişmeyen bilgiler. "En kalabalık", "son şampiyon", "şu anki
  rekor" gibi eskiyen sorular yok. Tartışmalı ya da kaynağa göre değişen bilgi yok.
- Her sorunun dayandığı olgu, o bölümün `sections` notlarında tek cümleyle yazılı olmalı
  ve `quote` o cümle olmalı. Her bölüm için 3 `sections` kaydı (sayfa), her sayfada
  5 sorunun olgu cümleleri. Sayfalar 1-9 arası numaralanır.
- `solution` olguya bir cümle bağlam ekler; `why` her yanlış şıkkın neyle karıştırıldığını
  söyler.
- Emin olmadığın olguyu sorma; iki kez düşün, yanlış olgu modülü değersiz kılar.
