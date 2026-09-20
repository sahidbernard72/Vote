export interface Kabupaten {
  id: string; // 'BLK', 'BRU', 'MRS'
  nama: string;
}

export interface Kecamatan {
  id: string; // 'B001', 'R001', 'M001'
  kabupatenId: string;
  nama: string;
}

export interface Desa {
  id: string; // e.g. 'B001001'
  kecamatanId: string;
  nama: string;
}

export interface PeriodeRekap {
  id: number;
  namaEvent: string;
  tahun: number;
  keterangan?: string;
  createdAt?: string;
}

export interface RekapDesaRow {
  desaId: string;
  namaDesa: string;
  kecamatanId: string;
  namaKecamatan: string;
  kabupatenId: string;
  namaKabupaten: string;
  rekapId: number | null;
  jumlahDpt: number | null;
  jumlahTps: number | null;
  updatedAt: string | null;
}

export interface DesaDetailItem {
  desaId: string;
  namaDesa: string;
  jumlahDpt: number | null;
  jumlahTps: number | null;
  status: 'TERISI' | 'BELUM_MASUK';
}

export interface KecamatanDetail {
  kecamatanId: string;
  namaKecamatan: string;
  kabupatenId: string;
  totalDpt: number;
  totalTps: number;
  desaCount: number;
  desaTerlapor: number;
  desaBelumMasuk: number;
  desasList: DesaDetailItem[];
}

export interface KabupatenDetail {
  kabupatenId: string;
  namaKabupaten: string;
  totalDpt: number;
  totalTps: number;
  totalDesa: number;
  desaTerlapor: number;
  desaBelumMasuk: number;
  progressPercent: number;
  kecamatanList: KecamatanDetail[];
}

export interface RekapStats {
  periodeId: number;
  totalDpt: number;
  totalTps: number;
  totalDesa: number;
  desaTerlapor: number;
  desaBelumMasuk: number;
  progressPercent: number;
  byKabupaten: KabupatenDetail[];
  byKecamatan: KecamatanDetail[];
}

export interface ServerHealth {
  status: string;
  serverTime: string;
  database: {
    connected: boolean;
    message: string;
  };
}
