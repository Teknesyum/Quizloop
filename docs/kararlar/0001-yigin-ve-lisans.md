# 0001 — Yığın ve lisans duruşu

Tarih: 2026-08-22 · Durum: kabul edildi

## Karar

Quizloop MIT lisanslı olacak ve **bağımlılık listesine AGPL girmeyecek.**

Yığın: Electron + React + TypeScript + Vite, `electron-vite@^5` şablonuyla kurulur.
Paketleme `electron-builder`, dağıtım GitHub Actions üç-OS matrisi.

## Neden bu bir karar gerektirdi

Ön araştırma, bu alandaki en olgun araçların çoğunun AGPL olduğunu gösterdi:

| Araç | Ne için en iyisi | Lisans | Sonuç |
|---|---|---|---|
| PyMuPDF / mupdf | konumlu görsel çıkarma | AGPL-3.0 | alınamaz |
| Anki | tekrar günlüğü ve kuyruk deseni | AGPL-3.0+ | desen alınır, kod alınmaz |
| Mnemosyne | paket formatı, kalıcı soru kimliği | AGPL-3.0 + ad şartı | desen alınır, şema kopyalanmaz |
| Moodle | soru bankası, şık başına geri bildirim | GPL-3.0 | desen alınır, kod alınmaz |
| H5P çekirdeği | çoktan seçmeli bileşen | GPL-3.0 | alınamaz |
| PageLM | belge yükleme ve sınav planı | ticari kullanım yasak | alınamaz |
| nougat | PDF yapı çıkarma | ağırlıklar CC-BY-NC | elendi |

Kural: **kapalı lisanslı projeden desen okunur, kod ve şema kopyalanmaz.**

## Yığın gerekçesi

`electron-vite@^5` seçildi. `electron-forge` kendi maker zincirini dayatıyor ve
`electron-builder` kararıyla çakışıyor. `electron-react-boilerplate`'in son etiketli
sürümü 2022 ve webpack tabanlı — ölü ağırlık.

## Sonuç

AGPL'siz PDF zinciri: `pypdfium2` + `pdfplumber` + `camelot-dev/camelot` + `docling`
(hepsi MIT/Apache/BSD). Çıkarma ayrı bir Python yan-sürecinde çalışır.
