# 0002 — Derece eşlemesi, emeklilik ve zamanlama motoru

Tarih: 2026-08-22 · Durum: kabul edildi

Bu dosya, `docs/taramalar/RAPOR.md` içinde çelişkili ya da açık görünen üç maddeyi
kapatır. Rapor taranan depoların söylediğini aktarır; karar burada verilir.

## 1. Easy notu üretilir

**Çelişki.** `docs/taramalar/fsrs.md` "üç seçenekle dört derece çıkmaz, Easy
üretilmez" diyor. `docs/PLAN.md` ise "şıklar açılmadan bilindi → Easy" diyor.

**Karar.** Easy üretilir.

**Gerekçe.** İki ifade aynı şeyi ölçmüyor. Tarama yalnız öznel beyanı (anladım /
kısmen / anlamadım) sayıyor ve o beyan tek başına gerçekten üç değer taşıyor. Bizim
eşlememizde Easy'nin kaynağı beyan değil, **nesnel bir olay**: kullanıcı şıkları hiç
açmadan bilmiş. Bu, beyandan bağımsız dördüncü bir sinyal.

**Sonuç.** Şıksız bilme mekaniği kapatılırsa Easy hiç üretilmez ve eşleme kendiliğinden
üç dereceye iner. FSRS bundan zarar görmez.

## 2. Yumuşak emeklilik v1'de yok

**Çelişki.** Plan iki emeklilik kipi tarif ediyordu: kullanıcının istediği "anladım
dedim, bir daha gelmesin" ve aralıklı tekrarın doğrusu olan "kararlılık bir yılı
geçince emekli et".

**Karar.** Yalnız birincisi uygulanır. `retired_at` alanı durur, ikinci kod yolu yok.

**Gerekçe.** Ayarlarda karşılığı olmayan bir bayrak için iki davranış yolu taşımak
bedava değil: her kuyruk sorgusu, her istatistik ve her testin iki hâli olur. Kullanıcı
ne istediğini açıkça söyledi.

**Ne zaman geri gelir.** Kullanıcı "emekli ettiğim soruları unutmuşum" derse. O gün
alan zaten yerinde olduğu için değişiklik kuyruk sorgusuyla sınırlı kalır.

## 3. Zamanlama motoru `ts-fsrs`

**Açık madde.** Rapor bunu "çözülmedi" diye bıraktı: `docs/taramalar/ilerleme-semasi.md`
SM-2'yi anıyor, `docs/taramalar/fsrs.md` FSRS diyor.

**Karar.** `ts-fsrs`, FSRS-6, varsayılan ağırlıklarla.

**Gerekçe.** SM-2'de "kısmen anladım" için doğal bir derece yok, lapse yönetimi kaba ve
uzun ufukta belirgin fazla tekrar üretiyor; Anki'nin kendisi de terk etti. `ts-fsrs`
MIT, npm bağımlılığı sıfır. Parametre optimizasyonu v1'de yok — bu yüzden `review_log`
ilk günden **tam alanlarla** açılır, sonradan eklenen alan geriye dönük doldurulamaz.

## 4. Ayarların yeri

**Çelişki.** Plan `setting` tablosunu SQLite'a koymuştu, rapor ayarları
`electron-store`'a.

**Karar.** Ayarlar yalnız `electron-store`, ilerleme yalnız SQLite. `setting` tablosu
şemadan çıkarıldı. İki yerde birden duran alan olmaz.
