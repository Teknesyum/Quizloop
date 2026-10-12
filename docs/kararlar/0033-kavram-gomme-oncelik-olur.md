# 0033 — Kavram Gömme Yasak Değil Öncelik Olur

Tarih: 2026-10-12. Plandaki "aynı `conceptId`'den günde en fazla bir soru" kuralını değiştirir.

## Sahibin Sözü

"İngilizce modül de 22 soru diyor içine girince 2 soru çöz Arapça da da çöz diğerlerinde de".

## Sorun

Dil modüllerinde bir kural tek kavramdır ve onlarca sorusu vardır. 21 soruluk bir bölümde 2
kavram varsa oturum 2 soruyla bitiyordu; kart 21 gösterirken kalan 19 soru o gün hiç
gelmiyordu.

## Karar

1. Kuyruk önce her kavramdan bir soru alır; sıra değişmez (çok takılan, vadesi gelen, yeni).
2. Oturum sınırı dolmadıysa kalan yer aynı kavramların öteki sorularıyla doldurulur. Her
   turda bir kavramdan yine tek soru alınır, böylece kardeş sorular art arda gelmez.
3. O gün çözülmüş kavramlar da aynı kurala girer: önce çözülmemiş kavramlar, yer kalırsa
   onlar.
4. Kısmen anlaşılanlar oturumu değişmez; orada gömme zaten yoktu.

Büyük bir modülde sınır ilk turda dolduğu için davranış eskisiyle aynıdır.
