# remarkjs/react-markdown

## Depo
`react-markdown` · https://github.com/remarkjs/react-markdown · MIT · npm 10.1.0, son etiket 10.1.0 (2025-03-07), depo son push 2025-04-21 · 15.860 yıldız · 5 açık issue · npm paketi 53 KB açılmış (`npm view`).

## Ne için bakıldı
PLAN.md zaten `react-markdown` + `remark-gfm` + `rehype-katex`, `rehype-raw` yok diyor. Bu tarama kararı sınıyor: yapay zekâ üretimi çözüm metninde tablo desteği yetiyor mu, KaTeX zinciri hangi sırayla kuruluyor, ham HTML kapalıyken ne kaybediyoruz, daktilo akarken her karakterde yeniden ayrıştırmanın bedeli ne.

## Alınacak fikirler
- **Güvenlik varsayılan olarak kapalı, tek kapı `urlTransform`.** README: "Use of `react-markdown` is secure by default", `dangerouslySetInnerHTML` yok; riski açan şey `urlTransform`'u gevşetmek ya da güvensiz eklenti/`components` vermek. Quizloop'ta modül görselleri için `asset://` şemasına izin gerekiyorsa tek bilinçli genişletme noktası burasıdır — başka yerde HTML'e dokunulmaz.
- **Eklenti zinciri tek yerde donmuş bir "render profili".** Sıra: `remarkPlugins` = math + gfm, `rehypePlugins` = katex; KaTeX CSS elle yüklenir. Diziler her render'da yeniden oluşturulursa tüm ağaç baştan kurulur — modül düzeyinde sabit referans olarak tutulur. Daktiloyla birleşince bu tek satır fark yaratır.
- **Blok bazlı bölme + memo.** Çözüm metni bloklara ayrılıp yalnız akan blok yeniden ayrıştırılır, biten bloklar memoize edilir. Aksi halde her karakter tüm metni mdast→hast→React olarak yeniden kurar: bir bloğun toplam maliyeti karakter sayısının karesiyle büyür. `icerik-render.md`'deki `minCommitMs` kısması bunun tamamlayıcısı, yerine geçeni değil.

## Kaçınılacaklar
- **`rehype-raw` eklemek.** Ham HTML açılır açılmaz `rehype-sanitize` zorunlu hale gelir ve güvenlik yüzeyi tek eklentiyle iki katına çıkar. Kaybettiğimiz şey ölçülü: `<br>`, `<sub>`/`<sup>`, `<details>`, genişlik verilmiş `<img>`, HTML tablolar — bunlar metin olarak kaçışlanır. Çözüm eklenti değil, üretim tarafı: şema/istem çıktıyı saf Markdown'a zorlar, kalan birkaç etiket `components` ile karşılanır.
- **`components` içinde `dangerouslySetInnerHTML` kullanmak.** Kütüphanenin tek gerçek güvencesini elle iptal eder.
- **Bakım hızını fazla saymak.** 2025-03'ten beri yeni etiket yok, depo 2025-04'ten beri push almamış. Açık issue 5 ve altındaki `unified`/`micromark` ekosistemi canlı, ama sürüm beklentisi kurulmaz — **bakım hızı doğrulanamadı**.
- ESM-only paket; Electron ana sürecinde değil, yalnız Vite ile paketlenen renderer tarafında kullanılır.

## Karar
`bağımlılık` — PLAN.md'deki seçim doğrulandı, `rehype-raw`'suz hâliyle.
`remark-gfm` tablo/görev listesi/üstü çizili için yeterli; eksik kalan HTML süsü içerik üretimi tarafında çözülür.
Daktilo maliyeti kütüphanenin değil, kullanım biçiminin sorunu: blok bölme + sabit eklenti dizisi + commit kısma.
