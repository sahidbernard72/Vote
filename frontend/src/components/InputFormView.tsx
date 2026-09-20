import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Send,
  RotateCcw,
  MapPin,
  Calendar,
  Layers,
  Info,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  PeriodeRekap,
  Kabupaten,
  Kecamatan,
  Desa,
  RekapDesaRow,
} from '../types';

interface InputFormViewProps {
  periodes: PeriodeRekap[];
  selectedPeriodeId: number;
  initialDesaId?: string;
  onSuccess: () => void;
}

export const InputFormView: React.FC<InputFormViewProps> = ({
  periodes,
  selectedPeriodeId,
  initialDesaId,
  onSuccess,
}) => {
  // Cascading dropdown states
  const [periodeId, setPeriodeId] = useState<number>(selectedPeriodeId || 1);
  const [kabupatenList, setKabupatenList] = useState<Kabupaten[]>([]);
  const [selectedKabupatenId, setSelectedKabupatenId] = useState<string>('BLK');

  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState<string>('');

  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string>(initialDesaId || '');

  // Stage 2 Flowchart Decision: Apakah Data DPT/TPS Desa Ada? (Ya / Tidak)
  const [hasDataAvailable, setHasDataAvailable] = useState<boolean>(true);

  // Input Values
  const [jumlahDpt, setJumlahDpt] = useState<string>('');
  const [jumlahTps, setJumlahTps] = useState<string>('');

  // Existing record check
  const [existingRekap, setExistingRekap] = useState<RekapDesaRow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Load Kabupaten (Bulukumba, Barru, Maros)
  useEffect(() => {
    api.getKabupaten().then((res) => {
      setKabupatenList(res.data);
      if (res.data.length > 0 && !selectedKabupatenId) {
        setSelectedKabupatenId(res.data[0].id);
      }
    });
  }, []);

  // 2. When Kabupaten changes, load Kecamatan
  useEffect(() => {
    if (!selectedKabupatenId) {
      setKecamatanList([]);
      setSelectedKecamatanId('');
      return;
    }
    api.getKecamatan(selectedKabupatenId).then((res) => {
      setKecamatanList(res.data);
      if (res.data.length > 0) {
        setSelectedKecamatanId(res.data[0].id);
      } else {
        setSelectedKecamatanId('');
      }
    });
  }, [selectedKabupatenId]);

  // 3. When Kecamatan changes, load Desa
  useEffect(() => {
    if (!selectedKecamatanId) {
      setDesaList([]);
      setSelectedDesaId('');
      return;
    }
    api.getDesa(selectedKecamatanId).then((res) => {
      setDesaList(res.data);
      if (res.data.length > 0) {
        // If initialDesaId belongs to this list, keep it
        const exists = res.data.some((d) => d.id === selectedDesaId);
        if (!exists) {
          setSelectedDesaId(res.data[0].id);
        }
      } else {
        setSelectedDesaId('');
      }
    });
  }, [selectedKecamatanId]);

  // 4. When Desa or Periode changes, inspect existing rekapitulasi data
  useEffect(() => {
    if (!selectedDesaId || !periodeId) {
      setExistingRekap(null);
      setJumlahDpt('');
      setJumlahTps('');
      return;
    }

    api.getRekap(periodeId).then((res) => {
      const match = res.data.find((r) => r.desaId === selectedDesaId);
      if (match) {
        setExistingRekap(match);
        if (match.jumlahDpt !== null && match.jumlahDpt !== undefined) {
          setHasDataAvailable(true);
          setJumlahDpt(String(match.jumlahDpt));
          setJumlahTps(match.jumlahTps !== null ? String(match.jumlahTps) : '');
        } else {
          // Explicitly NULL / Belum ada data
          setHasDataAvailable(false);
          setJumlahDpt('');
          setJumlahTps('');
        }
      } else {
        setExistingRekap(null);
        setHasDataAvailable(true);
        setJumlahDpt('');
        setJumlahTps('');
      }
    });
  }, [selectedDesaId, periodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedDesaId) {
      setFeedback({ type: 'error', message: 'Silakan pilih Desa/Kelurahan terlebih dahulu.' });
      return;
    }

    // If marked as having data, require DPT
    if (hasDataAvailable && (!jumlahDpt || Number(jumlahDpt) < 0)) {
      setFeedback({
        type: 'error',
        message: 'Masukkan angka riil jumlah DPT atau tandai opsi "Belum Tersedia (Simpan NULL)".',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.saveRekap({
        periodeId: Number(periodeId),
        desaId: selectedDesaId,
        jumlahDpt: hasDataAvailable && jumlahDpt.trim() !== '' ? Number(jumlahDpt) : null,
        jumlahTps: hasDataAvailable && jumlahTps.trim() !== '' ? Number(jumlahTps) : null,
      });

      setFeedback({
        type: 'success',
        message: res.message || 'Data rekapitulasi desa berhasil disimpan!',
      });
      onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyimpan data rekapitulasi.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJumlahDpt('');
    setJumlahTps('');
    setHasDataAvailable(true);
    setFeedback(null);
  };

  const currentDesaObj = desaList.find((d) => d.id === selectedDesaId);
  const currentKecObj = kecamatanList.find((k) => k.id === selectedKecamatanId);
  const currentKabObj = kabupatenList.find((b) => b.id === selectedKabupatenId);

  return (
    <div className="glass-panel form-container">
      <div className="form-header">
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            color: 'var(--accent-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <FileSpreadsheet size={28} />
        </div>
        <h2>Input Rekapitulasi Wilayah (rekap_desa)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Alur Bisnis: Pemilihan Wilayah Berjenjang (Kabupaten Bulukumba) &bull; Simpan Angka Riil atau Tandai <code>NULL</code> (Data Belum Masuk).
        </p>
      </div>

      {feedback && (
        <div className={`alert-box ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {existingRekap && (
        <div
          className="alert-box"
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
          }}
        >
          <Info size={20} />
          <div>
            <strong>Status Riwayat Desa:</strong>{' '}
            {existingRekap.jumlahDpt !== null ? (
              <span>
                Sudah memiliki data riil (DPT: {existingRekap.jumlahDpt?.toLocaleString('id-ID')}, TPS:{' '}
                {existingRekap.jumlahTps?.toLocaleString('id-ID')}). Formulir ini dalam mode pembaruan.
              </span>
            ) : (
              <span>
                Sebelumnya tercatat <em>"Data Belum Masuk" (NULL)</em>. Anda dapat memperbaruinya menjadi angka riil sekarang.
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* 1. Periode Event */}
          <div className="form-group full-width">
            <label htmlFor="periodeId" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} color="var(--accent-primary)" />
              1. Periode / Event Rekapitulasi *
            </label>
            <select
              id="periodeId"
              className="select-field"
              value={periodeId}
              onChange={(e) => setPeriodeId(Number(e.target.value))}
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaEvent} ({p.tahun}) {p.keterangan ? `— ${p.keterangan}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kabupaten */}
          <div className="form-group">
            <label htmlFor="kabupaten" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} color="var(--accent-secondary)" />
              2. Kabupaten *
            </label>
            <select
              id="kabupaten"
              className="select-field"
              value={selectedKabupatenId}
              onChange={(e) => setSelectedKabupatenId(e.target.value)}
            >
              {kabupatenList.map((k) => (
                <option key={k.id} value={k.id}>
                  [{k.id}] {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kecamatan (Cascading) */}
          <div className="form-group">
            <label htmlFor="kecamatan" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--accent-secondary)" />
              3. Kecamatan (Cascading Dropdown) *
            </label>
            <select
              id="kecamatan"
              className="select-field"
              value={selectedKecamatanId}
              onChange={(e) => setSelectedKecamatanId(e.target.value)}
              disabled={kecamatanList.length === 0}
            >
              {kecamatanList.map((kc) => (
                <option key={kc.id} value={kc.id}>
                  [{kc.id}] Kec. {kc.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Desa (Cascading) */}
          <div className="form-group full-width">
            <label htmlFor="desa" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} color="var(--accent-emerald)" />
              4. Desa / Kelurahan (Cascading Dropdown) *
            </label>
            <select
              id="desa"
              className="select-field"
              value={selectedDesaId}
              onChange={(e) => setSelectedDesaId(e.target.value)}
              disabled={desaList.length === 0}
            >
              {desaList.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.id}] Desa/Kel. {d.nama}
                </option>
              ))}
            </select>
            {currentDesaObj && currentKecObj && currentKabObj && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Lokasi terpilih: <strong>{currentDesaObj.nama}</strong> &bull; Kec.{' '}
                <strong>{currentKecObj.nama}</strong> &bull; <strong>{currentKabObj.nama}</strong>
              </span>
            )}
          </div>

          {/* 5. Alur Bisnis Step H: Apakah Data DPT/TPS Desa Ada? */}
          <div
            className="form-group full-width"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginTop: '0.5rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.95rem',
                color: '#e2e8f0',
                marginBottom: '0.75rem',
              }}
            >
              <HelpCircle size={16} color="var(--accent-primary)" />
              Apakah Data DPT / TPS Desa Sudah Tersedia? (Tahap 2 Flowchart)
            </label>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: hasDataAvailable ? '#818cf8' : '#94a3b8',
                }}
              >
                <input
                  type="radio"
                  name="dataAvailability"
                  checked={hasDataAvailable}
                  onChange={() => setHasDataAvailable(true)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <strong>Ya, Data Ada</strong> (Input & Simpan Angka Riil)
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: !hasDataAvailable ? '#fbbf24' : '#94a3b8',
                }}
              >
                <input
                  type="radio"
                  name="dataAvailability"
                  checked={!hasDataAvailable}
                  onChange={() => setHasDataAvailable(false)}
                  style={{ accentColor: '#f59e0b' }}
                />
                <strong>Tidak Ada / Belum Tersedia</strong> (Simpan sebagai <code>NULL</code> / &quot;Data Belum Masuk&quot;)
              </label>
            </div>
          </div>

          {/* Conditional Inputs: If hasDataAvailable === true */}
          {hasDataAvailable ? (
            <>
              <div className="form-group">
                <label htmlFor="jumlahDpt">Jumlah DPT Riil (Pemilih) *</label>
                <input
                  id="jumlahDpt"
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Contoh: 7500"
                  value={jumlahDpt}
                  onChange={(e) => setJumlahDpt(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total pemilih tetap yang terdaftar di desa ini.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="jumlahTps">Jumlah TPS Riil</label>
                <input
                  id="jumlahTps"
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Contoh: 25"
                  value={jumlahTps}
                  onChange={(e) => setJumlahTps(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Jumlah Tempat Pemungutan Suara yang ditetapkan.
                </span>
              </div>
            </>
          ) : (
            <div
              className="form-group full-width"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: '#fbbf24',
                fontSize: '0.875rem',
              }}
            >
              ℹ️ Rekap untuk desa ini akan disimpan ke tabel <code>rekap_desa</code> dengan nilai <code>jumlah_dpt = NULL</code> dan <code>jumlah_tps = NULL</code>. Di dashboard dan tabel, desa ini akan dilabeli <strong>&quot;Data Belum Masuk&quot; (-)</strong> dan tidak dimasukkan ke dalam penjumlahan total suara riil.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              background: hasDataAvailable
                ? 'linear-gradient(135deg, var(--accent-primary), #4338ca)'
                : 'linear-gradient(135deg, #d97706, #b45309)',
            }}
          >
            <Send size={16} />
            {loading
              ? 'Menyimpan...'
              : hasDataAvailable
              ? 'Simpan Angka Riil'
              : 'Tandai Data Belum Masuk (NULL)'}
          </button>
        </div>
      </form>
    </div>
  );
};
