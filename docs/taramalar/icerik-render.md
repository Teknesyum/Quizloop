# Zengin içerik render ve aşamalı metin gösterimi

Soru üç ayrı problemi karıştırıyor: akan Markdown'ın yarım etiketleri, React'te karakter başına render etmeden daktilo, LaTeX motoru seçimi. Her biri için işi üretimde çözmüş birer depo seçildi. `typed.js` ve `react-type-animation` elendi — ikisi de düz metin animatörü, Markdown ağacı akan içerikte işe yaramaz (ayrıca typed.js npm'de GPL-3.0, kapalı dağıtımda risk).

## Depolar

- **vercel/streamdown** (+ `remend` alt paketi) · https://github.com/vercel/streamdown · Apache-2.0 (GitHub API "NOASSERTION" der, LICENSE Apache-2.0) · son push 2026-08-21 · 5.530 yıldız, 39 açık issue · npm paketi 96 KB açılmış.
- **assistant-ui/assistant-ui** · https://github.com/assistant-ui/assistant-ui · MIT · son push 2026-08-22 · 11.782 yıldız, 76 açık issue · monorepo, ~130 MB depo.
- **KaTeX/KaTeX** · https://github.com/KaTeX/KaTeX · MIT · son push 2026-08-19, son sürüm v0.18.4 (2026-08-10) · 20.334 yıldız, 393 açık issue. Karşılaştırma: mathjax/MathJax · Apache-2.0 · 4.1.3 (2026-07-03) · 10.906 yıldız, 193 açık issue.

## Alınacak fikirler

- **Yarım Markdown'ı render öncesi onar (remend deseni).** Parse etmeden önce açık kalan işaretçiler kapatılır: `**kalın` kapatılır, yarım satır içi kod ve `$$formül` kapatılır, yarım bağlantı sahte URL'ye bağlanır, yarım görsel tamamen atılır, `20~25` kaçışlanıp yanlış üstü-çizili engellenir.
  Quizloop'ta typer ile renderer arasına tek saf fonksiyon olarak girer (şık açıklaması ve çözüm metni). Değeri: DOM her karakterde şekil değiştirmez, yıldızlar ekranda görünmez, bloklar zıplamaz. Maliyet: sıfır bağımlılık, saf string işi.
- **Hedef metin / görünen metin ayrımı + rAF (useSmooth deseni).** Animatör `targetText` ve `currentText` tutar; her karede "kalanı drainMs içinde bitir" kuralıyla açılacak karakteri hesaplar, `maxCharsPerFrame` kare başına tavan koyar, `minCommitMs` React'e commit sıklığını ayrı kısar — reveal her karede ilerler, state seyrek yazılır.
  Quizloop'ta typer motorunun çekirdeği. Değeri: karakter başına setState + Markdown yeniden parse maliyeti kalkar; "hepsini göster" bedava gelir (rAF iptal, currentText = targetText).
- **`prefers-reduced-motion: reduce` animasyonu kapatır ve açık `smooth={true}`'yu ezer.** assistant-ui media query'yi okuyup metni anında commit ediyor, önceliği dokümanda açıkça yazıyor.
  Quizloop'ta typer ve blok blok çözüm oynatımı için tek merkezi kanca. Değeri: erişilebilirlik ile "beklemek istemeyen kullanıcı" aynı anahtardan çözülür. Maliyet: birkaç satır.

## Kaçınılacaklar

- **MathJax'i varsayılan yapmak.** Ölçtüm: `katex.min.js` 277 KB + CSS 23 KB; MathJax `tex-mml-chtml.js` 1,17 MB (npm mathjax 20 MB, mathjax-full 34 MB açılmış). KaTeX senkron render eder, akan içerikte kare atlamaz. MathJax 4 otomatik satır kırma ve `displayOverflow` (scale/scroll/linebreak) getirdi; KaTeX uzun formülü kırmaz — `autobreak` #1023 2017'den beri açık, `breqn` #2005 açık. Öneri: KaTeX + uzun display formülü için yatay kaydırılabilir kap.
- **Türkçe cümleyi formülün içine gömmek.** KaTeX yalnız listelediği harflerin ölçüsünü bilir; tanımadığını sistem fontuyla ve "M yüksekliğinde" varsayarak dizer (docs/supported). ı, ğ, ş için dikey hizanın bozulup bozulmadığı **doğrulanamadı**, test edilmeli. Açıklama Markdown tarafında kalsın, `\text{}` içinde Türkçe cümle taşınmasın.
- **Daktilo metnini `aria-live` bölgesine koymak.** Her karakterde bildirim ekran okuyucuda kesik gürültü olur. assistant-ui mesaj metninde `aria-live` kullanmıyor (arama yalnız docs sayfalarında buldu). Doğru desen: animasyonlu düğüm `aria-hidden`, tam metin görsel olarak gizli düğümde, blok bitince tek seferde duyurulur.
- **PDF tablosunu görsel saklamak.** Görsel ölçeklenmez, aranamaz, ekran okuyucuya kapalıdır, tema değişince kırılır. GFM Markdown tablosu kanonik olsun (satır satır akıtılabilir, yarım satırı onarım fonksiyonu tolere eder); birleşik hücre gerekiyorsa dar bir HTML alt kümesi; görsel yalnız kurtarılamayan sayfa taraması için.
- **Streamdown'ı paket olarak almak.** Tailwind `@source` satırı, shadcn CSS değişkenleri, Shiki ve Mermaid eklentileriyle gelir — masaüstü paketine gizli yüzey ekler. Desen alınsın, bağımlılık alınmasın. Tek istisna: `remend` tek başına kurulabilir, sıfır bağımlılık.

## Karar önerisi

1. Typer = hedef/görünen metin + rAF + `minCommitMs`; skip anında commit.
2. Renderer'dan önce yarım-Markdown onaran saf fonksiyon (remend davranış listesi ölçüt).
3. Formül KaTeX; uzun display formülü yatay kaydırma kabında; MathJax alma.
4. `prefers-reduced-motion` tek kanca ve açık ayarı ezer; animasyonlu metin `aria-hidden`, tam metin gizli düğümde bir kez duyurulur.
5. PDF tabloları GFM Markdown saklanır; görsel son çare.
