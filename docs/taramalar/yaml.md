# yaml (eemeli/yaml)

## Depo
eemeli/yaml · https://github.com/eemeli/yaml · ISC (OSI onaylı, permissive) · v2.9.0
(2026-05-11) · 1.7k yıldız · ~9 MB depo, 37 açık issue, dış bağımlılığı yok.

## Ne için bakıldı
quizforge'un `rules.yaml` dosyasını kullanıcı elle yazacak ve araç da güncelleyecek.
İhtiyaç: yorumları ve boşlukları kaybetmeden oku-değiştir-yaz, ve hatada kullanıcıya
"şu satırda şu yanlış" diyebilmek.

## Alınacak fikirler
- **Yorum koruyan gidiş-dönüş (round-trip).** README açıkça "YAML yorumlarını ve boş
  satırları ayrıştırma, değiştirme, yazma" diyor. `rules.yaml` içindeki açıklama satırları
  quizforge bir alan eklediğinde silinmez — elle yazılan kural dosyası için asıl gereksinim bu.
  `js-yaml` bunu yapamaz; `load/dump` yorumları düşürür.
- **Satır/sütun veren hata nesnesi.** `YAMLParseError` üstünde `code` (ör. `BAD_INDENT`,
  `TAB_AS_INDENT`, `DUPLICATE_KEY`), `pos: [start,end]` ve `linePos: {line,col}` alanları
  var (kaynak: `src/errors.ts`). quizforge `verify` adımı bu üçünü doğrudan kullanıcı
  mesajına çevirebilir; kendi satır sayacımızı yazmaya gerek yok.
- **Üç katmanlı API.** `parse/stringify` (basit), `Document` (AST), `Lexer/Parser/Composer`
  (ham kaynak). Basit okuma için en üst katman, kural dosyasını düzenlerken `Document`
  katmanı. Aynı kütüphanede iki farklı ihtiyaç — ayrı bir düzenleyici bağımlılığı gerekmiyor.

## Kaçınılacaklar
- **Hatalar varsayılan olarak fırlatılmaz.** `Document` yolunda hatalar `doc.errors` /
  `doc.warnings` dizilerine toplanır; kontrol edilmezse bozuk kural dosyası sessizce
  yarım nesneye dönüşür. `verify` adımı bu dizileri açıkça okumalı.
- **`linePos` bedava değil.** Satır bilgisi bir `LineCounter`/`prettyErrors` gerektiriyor
  (`src/errors.ts` `LineCounter` import ediyor); ham `Lexer` yolunda elle bağlanmalı.
- **TypeScript 5.9 alt sınırı** README'de belirtilmiş — daha eski TS ile tip dosyaları
  sorun çıkarabilir. Quizloop'un TS sürümü bu tarama sırasında doğrulanmadı.
- YAML 1.1 ve 1.2'yi birlikte destekliyor; `yes/no` gibi 1.1 boolean'ları şema seçimine
  göre farklı davranır. Şema açıkça sabitlenmeli, varsayılana güvenilmemeli.

## Karar
`bağımlılık` — yorum koruyan yazma ve `linePos`'lu hata, elle yazılan `rules.yaml` için
`js-yaml`'ın veremediği iki şey. ISC lisansı MIT ile sorunsuz, sıfır dış bağımlılık.
