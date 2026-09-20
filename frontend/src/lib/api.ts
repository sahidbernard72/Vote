import type {
  Kabupaten,
  Kecamatan,
  Desa,
  PeriodeRekap,
  RekapDesaRow,
  RekapStats,
  ServerHealth,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  async checkHealth(): Promise<ServerHealth> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Gagal menghubungi backend ElysiaJS');
    return res.json();
  },

  async getPeriodes(): Promise<{ success: boolean; data: PeriodeRekap[] }> {
    const res = await fetch(`${API_BASE_URL}/api/periode`);
    if (!res.ok) throw new Error('Gagal mengambil daftar periode event');
    return res.json();
  },

  async createPeriode(data: { namaEvent: string; tahun: number; keterangan?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getKabupaten(): Promise<{ success: boolean; data: Kabupaten[] }> {
    const res = await fetch(`${API_BASE_URL}/api/wilayah/kabupaten`);
    if (!res.ok) throw new Error('Gagal mengambil daftar kabupaten');
    return res.json();
  },

  async getKecamatan(kabupatenId?: string): Promise<{ success: boolean; data: Kecamatan[] }> {
    const url = kabupatenId
      ? `${API_BASE_URL}/api/wilayah/kecamatan?kabupaten_id=${kabupatenId}`
      : `${API_BASE_URL}/api/wilayah/kecamatan`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil daftar kecamatan');
    return res.json();
  },

  async getDesa(kecamatanId?: string): Promise<{ success: boolean; data: Desa[] }> {
    const url = kecamatanId
      ? `${API_BASE_URL}/api/wilayah/desa?kecamatan_id=${kecamatanId}`
      : `${API_BASE_URL}/api/wilayah/desa`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil daftar desa');
    return res.json();
  },

  async getRekap(periodeId: number): Promise<{ success: boolean; data: RekapDesaRow[] }> {
    const res = await fetch(`${API_BASE_URL}/api/rekap?periode_id=${periodeId}`);
    if (!res.ok) throw new Error('Gagal mengambil rekapitulasi desa');
    return res.json();
  },

  async saveRekap(payload: {
    periodeId: number;
    desaId: string;
    jumlahDpt?: number | null;
    jumlahTps?: number | null;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/rekap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan rekap');
    return json;
  },

  async getStats(periodeId: number): Promise<RekapStats> {
    const res = await fetch(`${API_BASE_URL}/api/rekap/stats?periode_id=${periodeId}`);
    if (!res.ok) throw new Error('Gagal mengambil ringkasan analitik statistik');
    return res.json();
  },
};
