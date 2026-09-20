import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Calendar, Edit2, CheckCircle, AlertTriangle, X, Filter } from 'lucide-react';
import type { RekapDesaRow, PeriodeRekap } from '../types';

interface TableViewProps {
  rekapList: RekapDesaRow[];
  periodes: PeriodeRekap[];
  selectedPeriodeId: number;
  onSelectPeriode: (id: number) => void;
  loading: boolean;
  onRefresh: () => void;
  onEditDesa?: (desaId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  rekapList,
  periodes,
  selectedPeriodeId,
  onSelectPeriode,
  loading,
  onRefresh,
  onEditDesa,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('ALL');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'TERISI' | 'NULL'>('ALL');

  // Distinct kabupaten from data
  const kabupatenOptions = useMemo(() => {
    const map = new Map<string, string>();
    rekapList.forEach((r) => {
      if (r.kabupatenId && r.namaKabupaten) {
        map.set(r.kabupatenId, r.namaKabupaten);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [rekapList]);

  // Distinct kecamatan filtered by currently selected kabupaten (if any)
  const kecamatanOptions = useMemo(() => {
    const map = new Map<string, string>();
    rekapList.forEach((r) => {
      if (selectedKabupaten === 'ALL' || r.kabupatenId === selectedKabupaten) {
        if (r.kecamatanId && r.namaKecamatan) {
          map.set(r.kecamatanId, r.namaKecamatan);
        }
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [rekapList, selectedKabupaten]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rekapList.filter((r) => {
      const matchSearch =
        term === '' ||
        r.namaDesa.toLowerCase().includes(term) ||
        r.desaId.toLowerCase().includes(term) ||
        r.namaKecamatan.toLowerCase().includes(term) ||
        r.namaKabupaten.toLowerCase().includes(term);

      const matchKab = selectedKabupaten === 'ALL' || r.kabupatenId === selectedKabupaten;
      const matchKec = selectedKecamatan === 'ALL' || r.kecamatanId === selectedKecamatan;

      const hasRealData = r.jumlahDpt !== null && r.jumlahDpt !== undefined;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'TERISI' && hasRealData) ||
        (selectedStatus === 'NULL' && !hasRealData);

      return matchSearch && matchKab && matchKec && matchStatus;
    });
  }, [rekapList, searchTerm, selectedKabupaten, selectedKecamatan, selectedStatus]);

  const isFilterActive =
    searchTerm !== '' ||
    selectedKabupaten !== 'ALL' ||
    selectedKecamatan !== 'ALL' ||
    selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedKabupaten('ALL');
    setSelectedKecamatan('ALL');
    setSelectedStatus('ALL');
  };

  // Subtotals calculation
  const subtotalDpt = filteredRows.reduce((acc, r) => acc + (r.jumlahDpt || 0), 0);
  const subtotalTps = filteredRows.reduce((acc, r) => acc + (r.jumlahTps || 0), 0);
  const totalDesaTerisi = filteredRows.filter((r) => r.jumlahDpt !== null && r.jumlahDpt !== undefined).length;
  const totalDesaBelumMasuk = filteredRows.length - totalDesaTerisi;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tabel Data Rekapitulasi Wilayah</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Single Source of Truth: Transaksi <code>rekap_desa</code> Kabupaten Bulukumba.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          {/* Periode selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-secondary)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Calendar size={14} color="var(--accent-primary)" />
            <select
              className="select-field"
              style={{
                padding: '0.35rem',
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                minWidth: '150px',
              }}
              value={selectedPeriodeId}
              onChange={(e) => onSelectPeriode(Number(e.target.value))}
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaEvent}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Cari Desa, ID, Kecamatan..."
              style={{ paddingLeft: '2rem', width: '200px', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Kabupaten filter */}
          <select
            className="select-field"
            style={{ minWidth: '170px', fontSize: '0.85rem' }}
            value={selectedKabupaten}
            onChange={(e) => {
              setSelectedKabupaten(e.target.value);
              setSelectedKecamatan('ALL'); // Cascading reset
            }}
          >
            <option value="ALL">Semua Kabupaten</option>
            {kabupatenOptions.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.nama}
              </option>
            ))}
          </select>

          {/* Kecamatan filter (Cascading) */}
          <select
            className="select-field"
            style={{ minWidth: '170px', fontSize: '0.85rem' }}
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
          >
            <option value="ALL">
              {selectedKabupaten === 'ALL' ? 'Semua Kecamatan' : 'Semua Kec. di Kabupaten Ini'}
            </option>
            {kecamatanOptions.map((kc) => (
              <option key={kc.id} value={kc.id}>
                Kec. {kc.nama}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="select-field"
            style={{ minWidth: '170px', fontSize: '0.85rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
          >
            <option value="ALL">Semua Status Nilai</option>
            <option value="TERISI">✓ Terisi Angka Riil</option>
            <option value="NULL">⚠️ Data Belum Masuk (NULL)</option>
          </select>

          {/* Reset Filter Button */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              style={{
                background: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                color: '#be123c',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Reset Semua Filter"
            >
              <X size={14} /> Reset Filter
            </button>
          )}

          <button
            onClick={onRefresh}
            className="btn-primary"
            style={{ padding: '0.55rem 0.85rem' }}
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter summary badge */}
      {isFilterActive && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            Menyaring: <strong>{filteredRows.length}</strong> dari <strong>{rekapList.length}</strong> total desa
            (Terisi: <strong>{totalDesaTerisi}</strong>, Belum Masuk: <strong>{totalDesaBelumMasuk}</strong>)
          </span>
          <button
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          >
            Tampilkan Semua
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Desa</th>
              <th>Nama Desa / Kelurahan</th>
              <th>Kecamatan</th>
              <th>Kabupaten</th>
              <th style={{ textAlign: 'right' }}>Jumlah DPT</th>
              <th style={{ textAlign: 'right' }}>Jumlah TPS</th>
              <th style={{ textAlign: 'center' }}>Status Nilai</th>
              {onEditDesa && <th style={{ textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={onEditDesa ? 8 : 7}
                  style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}
                >
                  <AlertTriangle size={24} color="#d97706" style={{ marginBottom: '0.5rem' }} />
                  <div>Tidak ada data desa yang sesuai dengan filter pencarian.</div>
                  <button
                    onClick={handleResetFilters}
                    className="btn-primary"
                    style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                  >
                    Reset Filter
                  </button>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isNull = row.jumlahDpt === null || row.jumlahDpt === undefined;
                return (
                  <tr key={row.desaId}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {row.desaId}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      Desa {row.namaDesa}
                    </td>
                    <td>Kec. {row.namaKecamatan}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{row.namaKabupaten}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {isNull ? (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      ) : (
                        <span style={{ color: 'var(--accent-primary)' }}>
                          {row.jumlahDpt?.toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {isNull ? (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      ) : (
                        <span style={{ color: 'var(--accent-secondary)' }}>
                          {row.jumlahTps?.toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isNull ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(217, 119, 6, 0.1)',
                            color: '#b45309',
                            border: '1px solid rgba(217, 119, 6, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <AlertTriangle size={11} /> Data Belum Masuk
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(5, 150, 105, 0.1)',
                            color: '#047857',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircle size={11} /> Angka Riil
                        </span>
                      )}
                    </td>
                    {onEditDesa && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onEditDesa(row.desaId)}
                          style={{
                            background: isNull ? 'rgba(217, 119, 6, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                            border: `1px solid ${isNull ? 'rgba(217, 119, 6, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                            color: isNull ? '#b45309' : 'var(--accent-primary)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          title="Input / Edit nilai rekap desa ini"
                        >
                          <Edit2 size={12} />
                          {isNull ? 'Input' : 'Edit'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: '0.9rem 1rem' }}>
                  Subtotal ({totalDesaTerisi} Terisi Riil, {totalDesaBelumMasuk} Belum Masuk)
                </td>
                <td style={{ textAlign: 'right', color: 'var(--accent-primary)', padding: '0.9rem 1rem' }}>
                  {subtotalDpt.toLocaleString('id-ID')}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--accent-secondary)', padding: '0.9rem 1rem' }}>
                  {subtotalTps.toLocaleString('id-ID')}
                </td>
                <td colSpan={onEditDesa ? 2 : 1}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
