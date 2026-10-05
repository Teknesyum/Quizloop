# 0020 — Android Bildirimi Ve Onaysız Bitiş

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "Android bildirimini ekle ancak uygulama açılırken değil butona basıldığında
izin alınır" ve "oturumu bitirden sonra onayla gelmesin direk oturum özeti eğer 0 soruysa o
bile gelmeden direk kütüphaneye dön".

## Karar

1. **Android'de yerel bildirim.** `@capacitor/local-notifications` kabuğa eklendi.
   `QuizloopApi.notify` isteğe bağlıdır; yalnızca Android kabuğu doldurur. Paket geliştirme
   bağımlılığıdır, masaüstü kabuk anahtarı değişmedi (`a9cdb8ede97f18df`).
2. **İzin yalnızca düğmede istenir.** `requestPermissions` tek yerde, `notify.ask()` içinde
   çağrılır; onu da yalnızca Hedef sekmesindeki "Bildirimi Aç" düğmesi çağırır. Açılışta ve
   planlamada yalnızca `checkPermissions` bakılır; izin yoksa sessizce çıkılır.
3. **Bildirim önceden planlanır.** Telefon uygulaması arka planda çalışmadığı için saat
   19.00 bildirimi sisteme önceden verilir: hedef bitmemişse bugün 19.00, ayrıca yarın
   19.00. Uygulama her açıldığında ve soru çözüldükçe plan yenilenir; hedef bitince bugünkü
   silinir. Yarınki genel bir hatırlatmadır, uygulama o gün açılırsa güncellenir.
4. **Kesin alarm izni alınmaz.** `SCHEDULE_EXACT_ALARM` bildirimden çıkarıldı; bildirim
   birkaç dakika kayabilir, karşılığında kullanıcıdan ikinci bir izin istenmez.
5. **Oturum onaysız biter.** "Oturumu bitir", Esc ve geri tuşu doğrudan özeti açar. Hiç soru
   puanlanmadıysa özet de atlanır, kütüphaneye dönülür. Çözülenler zaten kaydedildiği için
   onay bir şey korumuyordu.

## Sonuç

Bildirim Play sürümüne ancak yeni bir yüklemeyle ulaşır; yükleme sahibin onayına bağlıdır.
Bildirim simgesi şimdilik eklentinin varsayılanıdır.
