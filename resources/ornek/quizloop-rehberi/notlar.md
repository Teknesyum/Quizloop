# QuizLoop rehber notları

## Sayfa 1: Modül Nedir, Nasıl Eklenir

QuizLoop bir soru çözme uygulamasıdır, ama içinde kendi soruları yoktur. Sorular modül adı verilen paketlerle gelir. Modül, bir konunun sorularını, şıklarını, çözümlerini ve varsa görsellerini bir arada taşıyan soru paketidir. Uygulama motor gibidir: soruları sıraya koyar, cevapları puanlar ve yanlışları açıklar. İçerik ise modülde durur. Bu ayrım sayesinde aynı uygulamayla istediğin konuyu çalışabilirsin. Modüller uygulamadan ayrı dağıtılır. Uygulama modül indirmez ve bir modül mağazası yoktur. Modül dosyası, o modülü hazırlayan kişiden gelir. Kurulu modüller **Kütüphane** ekranında kart olarak görünür. Her kartta modülün adı, sürümü, etiketleri ve soru sayısı yazar.

## Sayfa 2: Modül Nedir, Nasıl Eklenir

Tek dosyalık modül paketinin uzantısı `.qlmod` olur. Bu dosya, modül klasörünün sıkıştırılmış halidir. Masaüstünde bir `.qlmod` dosyasını kurmanın üç yolu vardır. Birincisi, Kütüphane'deki **Modül dosyası ekle** düğmesine basıp dosyayı göstermektir. İkincisi, dosyayı Kütüphane penceresine sürükleyip bırakmaktır. Üçüncüsü, dosyaya çift tıklamaktır; uygulama açılır ve modülü kurar. Modül sıkıştırılmamış bir klasör olarak geldiyse **Klasörden kur** düğmesi kullanılır. Kurulum sürerken ekranda adım adı ve yüzde gösteren bir ilerleme çubuğu çıkar. Kurulum bitince modülün adını ve soru sayısını söyleyen bir bildirim görünür. Bir sorun olursa bildirim **Kurulum başarısız** diye başlar.

## Sayfa 3: Modül Nedir, Nasıl Eklenir

Uygulamayla birlikte iki örnek modül gelir: şu an çözdüğün bu rehber ve bir genel kültür modülü. İkisi de ilk açılışta kendiliğinden kurulu gelir. Onları kaldırdıysan Kütüphane'deki **Örnek modülleri kur** düğmesi yeniden kurar. Kütüphane hiç modül yokken **Henüz modül yok** başlığını gösterir ve nasıl modül ekleneceğini anlatır. Telefonda da **Modül dosyası ekle** düğmesi vardır. Bu düğme telefonun dosya seçicisini açar ve yalnızca seçtiğin dosya okunur. Telefonda klasörden kurma yoktur; modül her zaman `.qlmod` paketi olarak alınır. Seçtiğin dosyalar cihazda okunur, hiçbir yere yüklenmez.

## Sayfa 4: Modül Nedir, Nasıl Eklenir

Her modül kartında **Diğer işlemler** menüsü bulunur. Menüde dört seçenek vardır: **Soru bankası**, **Modülü güncelle**, **Sıfırla** ve **Modülü kaldır**. **Modülü güncelle** bir dosya seçme penceresi açar; modülün yeni `.qlmod` dosyasını gösterirsin. **Sıfırla** önce onay ister. Onaylarsan sorular kalır, puanlar ve tekrar planı sıfırlanır. Yani modüle en baştan başlarsın. **Modülü kaldır** da onay ister ve daha ağır bir işlemdir: modülün tüm ilerlemesi de silinir. **Soru bankası** modülün bütün sorularını durumlarıyla birlikte listeler. Orada arama yapabilir ve yalnızca işaretli soruları süzebilirsin.

## Sayfa 5: Oturum Nasıl İşler

Çalışmaya başlamak için modül kartındaki **Oturuma başla** düğmesine basarsın. Bu düğme bölümler ekranını açar. Orada tek bir bölüm seçebilir ya da **Tüm konulardan karışık** düğmesiyle bütün bölümlerden soru alabilirsin. Karttaki **Karışık** düğmesi bölümler ekranını atlar ve doğrudan karışık oturum başlatır. Klavyeyle de gidilir: Kütüphane'de ok tuşlarıyla modül seçilir, Enter bölümler ekranını açar. Bölümler ekranında ok tuşlarıyla bölüm seçilir, Enter o bölümün oturumunu başlatır, Esc Kütüphane'ye döndürür. Oturumun üst çubuğunda kaçıncı soruda olduğun ve o ana kadarki puanın görünür.

## Sayfa 6: Oturum Nasıl İşler

Soru önce şıkları olmadan gelir, böylece önce kendin düşünürsün. Cevabı aklından bulduysan şıkları açmadan önce **Cevabı biliyorum** düğmesine ya da B tuşuna basarsın. Şıksız bilmek ekstra puan kazandırır. Emin değilsen **Şıkları göster** düğmesi ya da Boşluk tuşu şıkları açar. Şıklar açıkken A'dan E'ye harf tuşları şık seçer. Doğru seçim puan getirir. Yanlış seçim puan götürür ve o şık elenir. Elenen şıkkın altında, o yanlış cevap için yazılmış açıklama görünür. Böylece yalnızca doğruyu değil, neden yanıldığını da öğrenirsin. Doğru şıkkı bulana kadar denemeye devam edersin.

## Sayfa 7: Oturum Nasıl İşler

Soru kapanınca **Çözüm** başlığı altında doğru cevabın açıklaması görünür. Çözümün altında **Kaynak** kutusu vardır. Bu kutu, sorunun dayandığı alıntıyı, dosya adını ve sayfa numarasını gösterir. Böylece her sorunun nereden çıktığını kendin denetleyebilirsin. Ardından **Ne kadar anladın?** sorusu gelir ve üç düğme çıkar. **Anlamadım** dersen soru bu oturumda tekrar gelir. **Kısmen anladım** dersen soru yakında tekrar sorulur. **Anladım** dersen soru emekli olur ve bir daha sorulmaz. Bu üç düğmenin klavye karşılığı 1, 2 ve 3 tuşlarıdır. Puanladıktan sonra Enter ya da Boşluk sıradaki soruya geçirir.

## Sayfa 8: Oturum Nasıl İşler

Bir soruda hata görürsen **Soruyu işaretle** düğmesine ya da F tuşuna basarsın. Bu, soruya kusurlu anlamında bir bayrak koyar. Bayraklı sorular Soru bankası ekranında **İşaretli** süzgeciyle bulunur ve **Bayrakları dışa aktar** düğmesiyle dosyaya yazılır. Modülü hazırlayan kişi bu dosyayla hatalı soruları düzeltebilir. Oturumu erken kapatmak için **Oturumu bitir** düğmesi ya da Esc tuşu kullanılır; uygulama önce onay ister. Çözdüğün sorular kaydedilmiş olur, yani emeğin kaybolmaz. Oturum bitince **Oturum özeti** ekranı açılır. Özet beş sayı gösterir: toplam puan, görülen soru, ilk denemede doğru, emekli olan ve oturumda düzeltilen. Hangi tuşun o an ne yaptığı ekranın en altında yazılıdır.

## Sayfa 9: Aralıklı Tekrar

İnsan yeni öğrendiği bilgiyi hızla unutur. Buna unutma eğrisi denir: bilgi tekrar edilmezse zamanla silinir. Çare, bilgiyi tam unutmak üzereyken yeniden hatırlamaktır. Her başarılı hatırlama bilgiyi biraz daha kalıcı yapar, bu yüzden bir sonraki tekrar daha geç yapılabilir. Aralıklı tekrar bu düşünceye dayanır: iyi bildiğin soru seyrek, zorlandığın soru sık gelir. QuizLoop bu hesabı FSRS-6 adlı zamanlama yöntemiyle yapar. Sen tarih tutmazsın; hangi sorunun hangi gün geleceğine uygulama karar verir. Senin işin soruyu çözmek ve ne kadar anladığını dürüstçe söylemektir.

## Sayfa 10: Aralıklı Tekrar

Uygulama bir sonraki tekrar gününü iki bilgiye bakarak belirler. Birincisi nesnel sonuçtur: soruyu şıksız mı bildin, ilk denemede mi buldun, yoksa yanlış şık mı eledin. İkincisi senin beyanındır: anladım, kısmen anladım ya da anlamadım. İlk denemede doğru bulduğun soru, yanlış şık eledikten sonra bulduğun sorudan daha uzun süre bekler. Bu yüzden bir soru yarın, bir başkası on gün sonra karşına çıkabilir. Puanlamadan sonra ekranda **Sonraki tekrar** yazısı ve tarih görünür. Anlamadım dediğin soru ayrıca aynı oturumun sonuna eklenir ve üstünde **Bu oturumda tekrar** rozetiyle yeniden gelir. Emekli olan soru silinmez; yalnızca sıradan çıkar.

## Sayfa 11: Aralıklı Tekrar

Modül kartında dört sayı vardır. **Bugün sırada**, bugün çözmen için sırada bekleyen soruların sayısıdır. **Yeni**, henüz hiç görmediğin soruları sayar. **Öğreniliyor**, üzerinde çalıştığın ama henüz emekli olmamış soruları sayar. **Emekli**, anladım dediğin ve artık sorulmayan soruları sayar. Kartın köşesindeki yüzde, emekli soruların toplam soruya oranıdır; hepsi emekli olunca yüzde yüz olur. Günün ne zaman başladığını **Gün başlangıcı saati** ayarı belirler. Bu saatten önce çözülenler önceki güne sayılır; gece geç saatte çalışanlar için yararlıdır. **Oturum başına en çok soru** ayarı bir oturumun sırasını bu sayıda keser. Tekrar sırası bu sınıra dahil değildir. Bugün için soru kalmadıysa **Bu modülde bugün soru yok** yazısı çıkar.

## Sayfa 12: Ayarlar, İstatistik ve Taşıma

Arayüz boyutu bütün uygulamayı ölçekler; yazılar ve düğmeler birlikte büyür ya da küçülür. Klavyeden Ctrl ve artı büyütür, Ctrl ve eksi küçültür, Ctrl ve sıfır boyutu sıfırlar. **Dil** seçici arayüzü Türkçe ile İngilizce arasında değiştirir. **Yazı akışı hızı** ayarı soru metninin ekrana nasıl geldiğini belirler. Soru metni harf harf akar; hız **Yavaş**, **Normal** ya da **Hızlı** olabilir. **Kapalı** seçilirse metin anında görünür. Akan metne tıklamak da yazının tamamını hemen gösterir. Ayarlar ekranında yaptığın her değişiklik o anda kaydedilir ve **Ayarlar kaydedildi** bildirimi çıkar; ayrıca bir kaydet düğmesi yoktur.

## Sayfa 13: Ayarlar, İstatistik ve Taşıma

**İstatistik** ekranı bütün modüllerin toplamını gösterir. En üstte altı kutu vardır: modül, kart, bugün sırada, toplam tekrar, son yedi gün ve emekli. Başlığın yanında kaç günlük seri yaptığın yazar. Altında son yirmi altı haftayı gün gün gösteren bir ısı haritası bulunur; çok çalıştığın günler daha belirgin görünür. Sonraki grafik son otuz günün günlük tekrar sayısını çubuklarla verir. Her çubukta o gün ilk denemede doğru yaptığın soruların payı da görünür. **Kartların durumu** bölümü soruları dört gruba ayırır: yeni, öğreniliyor, tekrarda ve emekli. En altta **Modül ilerlemesi** her modül için görülen, emekli ve toplam soru sayısını yazar.

## Sayfa 14: Ayarlar, İstatistik ve Taşıma

İlerlemeni başka bir bilgisayara götürmek için **Taşıma paketi** kullanılır. Ayarlar'daki **Paketi dışa aktar** düğmesi ilerlemeyi, modülleri ve ayarları tek klasöre yazar. Bu klasörü USB bellekle öbür bilgisayara taşırsın ve orada **Paketi içe aktar** düğmesine basarsın. İçe aktarma önce onay ister, çünkü o bilgisayardaki ilerleme paketteki ile değiştirilir. Eski veritabanı silinmez, yedeklenir; ardından uygulama yeniden başlar. Güncellemeler için Ayarlar'da **Güncellemeleri denetle** düğmesi vardır. Windows sürümü kendini günceller. Linux ve macOS için yeni sürüm çıkınca haber verilir. Güncelleme denetimi yalnızca sürüm numarasını karşılaştırır; senin hakkında ya da çalışman hakkında bilgi göndermez.

## Sayfa 15: Ayarlar, İstatistik ve Taşıma

QuizLoop'ta hesap açmak ya da giriş yapmak gerekmez. Çalışma verin cihazında kalır: cevapların, puanların, tekrar planın, işaretlediğin sorular ve ayarların yalnızca kendi cihazında saklanır. Uygulamada reklam ve kullanım izleme yoktur. Uygulama internet olmadan da eksiksiz çalışır; ağa yalnızca güncelleme denetimi için çıkar. Veri sende olduğu için denetim de sendedir: **Sıfırla** bir modülün ilerlemesini temizler, **Modülü kaldır** modülü siler, uygulamayı kaldırmak ise her şeyi siler. QuizLoop'un telefon sürümü de vardır ve Android'de çalışır. Telefonda yeni sürüm çıkınca haber verilir ve indirme sayfası tarayıcıda açılır. Uygulama açık kaynaklıdır; lisansı AGPL-3.0-or-later'dır.
