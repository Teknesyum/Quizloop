# 0014 — Modül Sürüm Değişiminde Onay

Tarih: 2026-10-04. Sahibin sözü: "bir modülün daha yeni bir versiyonu yüklenmeye
çalışıldığında güncellensin mi gibi bir uyarı çıksın, şu sürümden şu sürüme şeklinde."

**Karar.** Kurulu bir modülün başka sürümü yüklenirken kurulum durur ve kullanıcıya
sorar: "Sürüm A → B". Onay gelmeden kurulu modüle dokunulmaz.

## Nasıl İşler

- Paket açılıp `module.json` okunduktan sonra, eski klasör silinmeden önce sorulur.
  Böylece büyük paket iki kez açılmaz ve vazgeçen kullanıcının modülü yerinde kalır.
- Kabuk (masaüstünde ana süreç, telefonda `shell.ts`) arayüze `module:confirm` olayı
  yollar, cevabı `module:answer` ile bekler. Tek yol olduğu için dosya seçme, sürükleme,
  çift tıklama ve "Modülü güncelle" aynı pencereyi gösterir.
- Yeni sürüm daha büyükse başlık "Güncellensin Mi?", daha küçükse "Eski Sürüme Dönsün
  Mü?" olur. Aynı sürüm yeniden kurulursa sorulmaz.
- Vazgeçilince sonuç `cancelled` döner; bildirim çıkmaz, açılan geçici dosyalar silinir.
- Uygulamayla gelen örnek modüller sormadan kurulur.
