# JRZ SCORE — Digital Scoring Pencak Silat IPSI (Online Firebase RTDB)

Aplikasi scoring digital Pencak Silat (Kategori Tanding & Jurus TGRS IPSI 2026 / PERSILAT) berbasis web yang berjalan **100% online** menggunakan **Firebase Realtime Database (`jrz-score`)** dan **Firebase Authentication**, siap dipublikasikan langsung melalui **GitHub & GitHub Pages**.

---

## Arsitektur & Konfigurasi Firebase

Aplikasi diinisialisasi sejak startup aplikasi (`src/main.tsx` -> `src/services/firebase.ts`) menggunakan konfigurasi proyek Firebase resmi:

- **Project ID:** `jrz-score`
- **Auth Domain:** `jrz-score.firebaseapp.com`
- **Realtime Database URL:** `https://jrz-score-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Storage Bucket:** `jrz-score.firebasestorage.app`

### Ketahanan Koneksi & Auto-Sync Real-Time
- Seluruh panel (Dewan, Sekretaris, Juri 1–3, Timer, Scoreboard TV, Portal, dan Jurus TGRS) terhubung secara real-time ke **Firebase Realtime Database (`jrz-score`)**.
- Apabila koneksi internet atau koneksi ke Firebase RTDB sempat terputus/terganggu, aplikasi tetap berjalan normal dengan penyimpanan penyangga lokal (*local snapshot & pending queue*) sehingga data yang ada tetap dapat digunakan dan skor baru otomatis tersinkron ke Firebase saat koneksi stabil kembali.

---

## Contoh Aturan Keamanan Firebase Realtime Database (RTDB Rules)

Pastikan di Firebase Console (**Realtime Database -> Rules**) Anda mengizinkan akses baca/tulis pada path `events` dan `users` sesuai kebijakan turnamen Anda:

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        ".write": true
      }
    },
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

> Untuk keamanan produksi yang lebih ketat, aktifkan Firebase Authentication (Anonymous / Email & Password / Google Sign-In) di Firebase Console lalu ganti aturan menjadi `auth != null`.

---

## Publikasi ke GitHub & GitHub Pages

Repository ini sudah dikonfigurasi dengan `base: "./"` pada `vite.config.ts`, bundle statis siap pakai pada folder `docs/`, serta workflow otomatis `.github/workflows/deploy.yml`.

### Pilihan Pengaturan GitHub Pages:
1. **Opsi A (Direkomendasikan): GitHub Actions**
   - Buka repository di GitHub -> **Settings** -> **Pages** -> **Source**, pilih **GitHub Actions**.
   - Setiap push ke branch `main`/`master` otomatis menjalankan `npm run build:gh` dan men-deploy folder `dist/`.
2. **Opsi B: Deploy from a branch (`main / (root)` atau `main / docs`)**
   - Folder `docs/` berisi build statis terkompilasi, dan `index.html` di root otomatis mengarahkan ke `./docs/` jika dibuka langsung sebagai file statis tanpa GitHub Actions sehingga halaman tidak pernah blank putih.
   - Jika mengubah kode secara lokal sebelum push manual ke branch, jalankan `npm run build:docs` terlebih dahulu agar folder `docs/` ikut diperbarui.

---

## Pengembangan Lokal

```bash
npm install
npm run dev
```

Build produksi statis (untuk GitHub Pages / static hosting):

```bash
npm run build:gh
```
