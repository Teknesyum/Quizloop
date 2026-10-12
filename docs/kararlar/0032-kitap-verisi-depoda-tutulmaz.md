# 0032 — Kitap Verisi Depoda Tutulmaz

Tarih: 2026-10-12. Karar 0004'ün kaynak klasörü maddesini değiştirir.

## Sahibin Sözü

"neden projemizde lange falan var example şekilde olacak githubdaki veriler".

"kitap verisi gite aktarılmayacak gitignore o kısım geçmişi de düzelt telif davası açsa adam
şimdi bize haklı".

## Karar

1. **`sources/` yereldir.** Gerçek bir kitabın `rules.yaml`, `chapters.json`, `pages.jsonl` ve
   `build/` dosyaları git'e girmez. `.gitignore` bütün `sources/*` klasörünü dışarıda tutar;
   yalnız tarafsız şablon `sources/example/rules.yaml` izlenir. Yeni kitap için şablon yerel
   bir klasöre kopyalanır.
2. **Depoda kitap adı yok.** Belge, test, istem ve commit mesajlarında gerçek kitap, yazar,
   yayınevi, dosya adı ya da dosya hash'i geçmez; yerine `example`, `Example Book`,
   `example.pdf` yazılır.
3. **Gerçek içerikli görüntü yok.** Arayüz denetimi, mağaza ve katalog görüntüleri yalnız
   uygulamayla gelen örnek modüllerden alınır. Gerçek modülden alınmış görüntü ve kanıt
   dosyası depoya girmez.
4. **Geçmiş temizlendi.** Bütün commit ve etiketler yeniden yazıldı: `sources/` altındaki
   kitap klasörü, `docs/ui-denetim/` altındaki görüntüler ve kanıt dosyaları, `.tmp-olgu/`
   ve eski katalog görüntüleri silindi; metinlerde ve commit mesajlarında kitap adı
   `example` oldu. `docs/ui-denetim/*.md` raporlarındaki görüntü bağlantıları artık boştur.

## Neden

Kitap adı, bölüm haritası, dosya hash'i ve gerçek sorulardan alınmış ekran görüntüleri açık
depoda telifli bir eserden çalışıldığını gösteriyordu. Motor ve üretim hattı kitaptan
bağımsızdır; örnek bir şablon aynı işi görür.
