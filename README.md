# JRZ SCORE — Digital Scoring Pencak Silat IPSI (Online Firebase RTDB)

Aplikasi scoring digital Pencak Silat (Kategori Tanding & Jurus TGRS IPSI 2026 / PERSILAT) berbasis web yang berjalan **100% online** menggunakan **Firebase Realtime Database (`jrz-score`)** dan **Firebase Authentication**, siap dipublikasikan langsung melalui **GitHub & GitHub Pages**.

---

## Arsitektur & Konfigurasi Firebase

Aplikasi diinisialisasi sejak startup aplikasi (`src/main.tsx` -> `src/services/firebase.ts`) menggunakan konfigurasi proyek Firebase resmi:

- **Project ID:** `jrz-score`
- **Auth Domain:** `jrz-score.firebaseapp.com`
- **Realtime Database URL:** `https://jrz-score-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Storage Bucket:** `jrz-score.firebasestorage.app`

### Proteksi Mode Online-Only
- Seluruh panel (Dewan, Sekretaris, Juri 1–3, Timer, Scoreboard TV, Portal, dan Jurus TGRS) wajib terhubung ke internet dan **Firebase Realtime Database `.info/connected`**.
- Jika koneksi internet atau koneksi ke Firebase RTDB terputus, layar pemblokiran online-only aktif secara otomatis untuk mencegah ketidaksinkronan skor antar perangkat.
- Seluruh service worker offline (`sw.js`), BroadcastChannel lokal, serta skrip offline packaging telah dihapus.

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

Repository ini sudah dikonfigurasi dengan `base: "./"` pada `vite.config.ts` serta workflow otomatis `.github/workflows/deploy.yml`.

### Langkah Publish:
1. **Push kode ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Deploy JRZ Score Online Firebase"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```
2. **Aktifkan GitHub Pages:**
   - Buka repository Anda di GitHub -> **Settings** -> **Pages**.
   - Pada bagian **Build and deployment -> Source**, pilih **GitHub Actions**.
3. **Selesai!** Setiap push ke branch `main` atau `master` akan otomatis menjalankan `npm run build:gh` dan mempublikasikan situs ke `https://<username>.github.io/<nama-repo>/`.

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
