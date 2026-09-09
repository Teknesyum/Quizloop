# Netleştirme: Quizloop'un oturum ekranı okunabilir değil ve genişliği verimsiz kullanıyor. Kul

- tarih: 2026-09-09
- girdi: 005-quizloop-un-oturum-ekrani-okunabilir-deg-girdi.md
- maliyet: 51.549 token, 15 sn

## Dönen

Belirsiz kalan yerler:

1. Çok sütunlu düzen (soru sol, şıklar sağ) 1600px'te kabul edilebilir mi, yoksa `--tk-measure: 65ch` kuralı gereği tek sütun sınırı korunmalı mı — okunabilirlik mi genişlik mi öncelikli?
2. "Siyah üstüne beyaz" yorgunluğu için `--tk-text: #ffffff` dışında daha yumuşak bir gövde metni tonu tokenlarda var mı (ör. `--tk-text-muted`), yoksa yalnız panel yüzeyi ve satır yüksekliğiyle mi çözülecek?
3. Terim vurgusu için kaynak yalnız `tags` mi, yoksa soru içeriğine `vurgu` gibi yeni bir alan eklenebilir mi (şema değişikliği serbest mi)?
4. Otomatik geçiş için gecikme süresi ve geri sayım göstergesi tokenlardaki bir hareket/süre değeri (`--tk-dur-*`) ile mi sınırlı, yoksa süre serbest mi?
5. "Üst menüye dönme" isteği bu turun kapsamında mı, yoksa yalnız beş maddeyle mi sınırlı kalınacak?
