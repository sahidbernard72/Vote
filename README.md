# Sistem Informasi & Visualisasi Data Pemilih Tetap (DPT)

Aplikasi manajemen dan visualisasi data pemilih berbasis **ElysiaJS (Bun)**, **MySQL (Drizzle ORM)**, dan **React (Vite + TypeScript)**.

---

## 📁 Struktur Folder

```text
vote/
├── backend/                  # REST API server berbasis ElysiaJS + Bun
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts      # Inisialisasi pool MySQL & Drizzle ORM
│   │   │   └── schema.ts     # Definisi skema tabel voters (DPT)
│   │   └── index.ts          # Server ElysiaJS, CORS, Swagger, dan endpoint DPT
│   ├── drizzle.config.ts     # Konfigurasi migrasi Drizzle MySQL
│   ├── .env.example          # Contoh variabel environment database
│   └── package.json
│
├── frontend/                 # Web Dashboard berbasis React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Header, tab menu & status API/MySQL
│   │   │   ├── DashboardView.tsx  # Metrik & grafik analitik (Recharts)
│   │   │   ├── InputFormView.tsx  # Form input data pemilih lengkap
│   │   │   └── TableView.tsx      # Tabel DPT dengan pencarian dan filter
│   │   ├── lib/
│   │   │   └── api.ts        # Client komunikasi ke backend
│   │   ├── types.ts          # Definisi tipe data TypeScript
│   │   ├── index.css         # Styling modern Vanilla CSS (Dark mode & glassmorphism)
│   │   └── App.tsx
│   └── package.json
│
└── package.json              # Root shortcut runner
```

---

## 🚀 Cara Menjalankan Proyek

### 1. Konfigurasi Backend & Database
1. Buka folder `backend/`:
   ```bash
   cd backend
   ```
2. Sesuaikan konfigurasi database MySQL di berkas `.env`:
   ```env
   PORT=3000
   DATABASE_URL=mysql://user:password@localhost:3306/dpt_db
   ```
3. Dorong skema tabel ke MySQL (Drizzle Kit):
   ```bash
   bun run db:push
   ```
   *(Catatan: Jika MySQL belum menyala, server otomatis berjalan dalam **Mock Mode** dengan data dummy sehingga frontend tetap dapat langsung digunakan).*

4. Jalankan backend dev server:
   ```bash
   bun run dev
   ```
   - Server berjalan di: `http://localhost:3000`
   - Dokumentasi Swagger OpenAPI di: `http://localhost:3000/swagger`

---

### 2. Menjalankan Frontend
Buka terminal baru di folder `frontend/`:
```bash
cd frontend
bun run dev
# atau: npm run dev
```
Aplikasi web akan dapat diakses di `http://localhost:5173`.

---

## ✨ Fitur Utama
1. **Visualisasi Statistik (Recharts)**:
   - Ringkasan total pemilih, proporsi jenis kelamin, dan jumlah TPS.
   - Grafik batang distribusi per TPS.
   - Diagram lingkaran komposisi jenis kelamin.
   - Distribusi rentang usia pemilih.
   - Diagram status registrasi pemilih (Terdaftar, Baru, Pindah Memilih, TMS).
2. **Formulir Input Data DPT**:
   - Form pendaftaran pemilih terstruktur (NIK, NKK, Nama, Jenis Kelamin, Usia, TPS, RT/RW, Wilayah, Status).
   - Validasi input dan notifikasi umpan balik instan.
3. **Daftar Pemilih & Pencarian**:
   - Filter cepat berdasarkan status dan gender.
   - Pencarian real-time berdasarkan NIK, Nama, TPS, atau Wilayah.
4. **Resilient Backend**:
   - Graceful fallback jika MySQL belum terkoneksi, sehingga UI visualisasi dapat diuji langsung saat pengembangan.
