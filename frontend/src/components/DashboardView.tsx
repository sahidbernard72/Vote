import React, { useState } from 'react';
import {
  Users,
  Building2,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Award,
  Vote,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { RekapStats, PeriodeRekap } from '../types';
import { GeoHeatmap } from './GeoHeatmap';

interface DashboardViewProps {
  stats: RekapStats | null;
  periodes: PeriodeRekap[];
  selectedPeriodeId: number;
  onSelectPeriode: (id: number) => void;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToInputDesa?: (desaId: string) => void;
}

const KABUPATEN_COLORS: Record<string, string> = {
  BLK: '#4f46e5', // Indigo (Bulukumba)
  BRU: '#0284c7', // Cyan/Sky (Barru)
  MRS: '#059669', // Emerald (Maros)
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  periodes,
  selectedPeriodeId,
  onSelectPeriode,
  loading,
  onRefresh,
  onNavigateToInputDesa,
}) => {
  // Drill-down State:
  const [selectedKabId, setSelectedKabId] = useState<string | null>(null);
  const [selectedKecId, setSelectedKecId] = useState<string | null>(null);

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem' }}>Menghitung agregasi berjenjang wilayah...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Data statistik agregasi belum tersedia.</p>
        <button onClick={onRefresh} className="btn-primary" style={{ marginTop: '1rem' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // Is single kabupaten mode active? (e.g. only Bulukumba is active)
  const isSingleKab = stats.byKabupaten.length === 1;
  const singleKab = isSingleKab ? stats.byKabupaten[0] : null;

  // Active drill-down objects
  const activeKab = isSingleKab
    ? singleKab
    : stats.byKabupaten.find((k) => k.kabupatenId === selectedKabId) || null;
  const activeKec = activeKab?.kecamatanList.find((kc) => kc.kecamatanId === selectedKecId) || null;

  // Global Averages & Metrics
  const avgDptPerTps = stats.totalTps > 0 ? Math.round(stats.totalDpt / stats.totalTps) : 0;

  // Comparison Bar Chart Data (Bulukumba vs Barru vs Maros)
  const comparisonData = stats.byKabupaten.map((k) => ({
    name: k.namaKabupaten.replace('Kabupaten ', ''),
    kabupatenId: k.kabupatenId,
    totalDpt: k.totalDpt,
    totalTps: k.totalTps,
    desaTerlapor: k.desaTerlapor,
    totalDesa: k.totalDesa,
    progressPercent: k.progressPercent,
  }));

  // Top 5 Largest Districts by DPT
  const topKecamatan = [...stats.byKecamatan]
    .sort((a, b) => b.totalDpt - a.totalDpt)
    .slice(0, 5);

  // Sorted kecamatan by totalDpt descending so chart matches Top 5 leaderboard order
  const sortedKecamatanList = singleKab
    ? [...singleKab.kecamatanList].sort((a, b) => b.totalDpt - a.totalDpt)
    : [];

  return (
    <div>
      {/* Top Header & Breadcrumb Bar */}
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <h2>
            {isSingleKab
              ? `Visualisasi & Analisis Wilayah ${singleKab?.namaKabupaten}`
              : 'Visualisasi & Analisis Wilayah'}
          </h2>

          {/* Breadcrumbs Navigation */}
          <div className="dashboard-header-breadcrumb">
            {isSingleKab ? (
              <>
                <button
                  onClick={() => setSelectedKecId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: !selectedKecId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: !selectedKecId ? 700 : 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {singleKab?.namaKabupaten}
                </button>
                {activeKec && (
                  <>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      Kecamatan {activeKec.namaKecamatan}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedKabId(null);
                    setSelectedKecId(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: !selectedKabId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: !selectedKabId ? 700 : 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Komparasi 3 Kabupaten
                </button>

                {activeKab && (
                  <>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <button
                      onClick={() => setSelectedKecId(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: !selectedKecId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: !selectedKecId ? 700 : 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {activeKab.namaKabupaten}
                    </button>
                  </>
                )}

                {activeKec && (
                  <>
                    <ChevronRight size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      Kecamatan {activeKec.namaKecamatan}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Periode selector & refresh */}
        <div className="dashboard-header-actions">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-card)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Calendar size={15} color="var(--accent-primary)" />
            <select
              className="select-field"
              style={{ padding: '0.35rem', border: 'none', background: 'transparent', fontSize: '0.85rem' }}
              value={selectedPeriodeId}
              onChange={(e) => onSelectPeriode(Number(e.target.value))}
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaEvent} ({p.tahun})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="btn-primary"
            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Hitung Ulang
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SINGLE KABUPATEN (BULUKUMBA OVERVIEW & DRILL-DOWN)                */}
      {/* ========================================================================= */}
      {isSingleKab && singleKab && (
        <>
          {/* LEVEL 1: BULUKUMBA OVERVIEW (Jika belum memilih kecamatan) */}
          {!selectedKecId && (
            <>
              {/* 1. Global Executive KPI Cards */}
              <div className="metrics-grid">
                {/* Total DPT */}
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total DPT {singleKab.namaKabupaten}</h3>
                    <div className="value" style={{ color: 'var(--accent-primary)' }}>
                      {singleKab.totalDpt.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pemilih Terdaftar Riil
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <Users size={24} />
                  </div>
                </div>

                {/* Total TPS */}
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total TPS Riil</h3>
                    <div className="value" style={{ color: 'var(--accent-secondary)' }}>
                      {singleKab.totalTps.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Titik Tempat Pemungutan Suara
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-secondary)' }}>
                    <Building2 size={24} />
                  </div>
                </div>

                {/* Rata-rata Pemilih per TPS */}
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Rata-rata Pemilih / TPS</h3>
                    <div className="value" style={{ color: 'var(--accent-emerald)' }}>
                      {avgDptPerTps.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Beban Rata-rata per TPS
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)' }}>
                    <Vote size={24} />
                  </div>
                </div>

                {/* Progres Pelaporan Desa */}
                <div className="glass-panel metric-card">
                  <div className="metric-info" style={{ width: '100%', paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Kelengkapan Desa</h3>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {singleKab.progressPercent}%
                      </span>
                    </div>
                    <div className="value" style={{ fontSize: '1.75rem' }}>
                      {singleKab.desaTerlapor}{' '}
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        / {singleKab.totalDesa} Desa
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '999px',
                        marginTop: '0.5rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(singleKab.progressPercent, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <CheckCircle size={24} />
                  </div>
                </div>
              </div>

              {/* 2. Interactive Geo Heatmap Component */}
              <div className="map-section">
                <div className="map-section-title">
                  <MapPin size={18} color="var(--accent-primary)" />
                  Peta Distribusi Wilayah {singleKab.namaKabupaten}
                </div>
                <GeoHeatmap
                  stats={stats}
                  onSelectKabupaten={() => {}}
                  onSelectKecamatan={(_, kecId) => setSelectedKecId(kecId)}
                />
              </div>

              {/* 3. Charts & Leaderboard Row */}
              <div className="charts-grid" style={{ marginBottom: '2rem' }}>
                {/* Bar Chart: Distribusi DPT 10 Kecamatan */}
                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <Layers size={18} color="var(--accent-primary)" />
                      Distribusi DPT 10 Kecamatan di {singleKab.namaKabupaten}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (Terurut DPT Terbanyak) &bull; Klik batang untuk rincian desa
                    </span>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortedKecamatanList}
                        margin={{ top: 15, right: 10, left: -15, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="namaKecamatan"
                          stroke="#64748b"
                          tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }}
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          width={38}
                          tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            color: '#0f172a',
                            fontSize: '0.8rem',
                          }}
                          formatter={(val: any) => [val.toLocaleString('id-ID') + ' Pemilih', 'Total DPT']}
                        />
                        <Bar
                          dataKey="totalDpt"
                          name="Total DPT"
                          fill="var(--accent-primary)"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => setSelectedKecId(entry.kecamatanId)}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Leaderboard: Top 5 Kecamatan Terpadat */}
                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <Award size={18} color="var(--accent-amber)" />
                      Top 5 Kecamatan Terpadat di {singleKab.namaKabupaten}
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Kecamatan</th>
                          <th style={{ textAlign: 'right' }}>Total DPT</th>
                          <th style={{ textAlign: 'right' }}>TPS</th>
                          <th style={{ textAlign: 'center' }}>Kelengkapan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topKecamatan.map((kc, idx) => {
                          const pct = kc.desaCount > 0 ? Math.round((kc.desaTerlapor / kc.desaCount) * 100) : 0;
                          return (
                            <tr
                              key={kc.kecamatanId}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedKecId(kc.kecamatanId)}
                            >
                              <td style={{ fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)' }}>
                                #{idx + 1}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                Kec. {kc.namaKecamatan}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
                                {kc.totalDpt.toLocaleString('id-ID')}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                                {kc.totalTps}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge"
                                  style={{
                                    background: pct === 100 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                    color: pct === 100 ? '#059669' : '#d97706',
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.55rem',
                                  }}
                                >
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 4. Grid 10 Kecamatan Bulukumba */}
              <div className="section-header">
                <h3>
                  10 Kecamatan di {singleKab.namaKabupaten}
                </h3>
                <p>
                  Pilih kecamatan untuk membuka rincian status riil / NULL pada seluruh desa/kelurahan.
                </p>
              </div>

              <div className="kecamatan-grid">
                {singleKab.kecamatanList.map((kc) => {
                  const pct = kc.desaCount > 0 ? Math.round((kc.desaTerlapor / kc.desaCount) * 100) : 0;
                  return (
                    <div
                      key={kc.kecamatanId}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: '4px solid var(--accent-primary)',
                      }}
                      onClick={() => setSelectedKecId(kc.kecamatanId)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            [{kc.kecamatanId}]
                          </span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.1rem' }}>
                            Kec. {kc.namaKecamatan}
                          </h4>
                        </div>
                        <ChevronRight size={16} color="var(--accent-primary)" />
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.75rem',
                          marginTop: '0.85rem',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DPT Riil</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                            {kc.totalDpt.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TPS Riil</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                            {kc.totalTps.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            marginBottom: '0.3rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Desa Terdata:</span>
                          <span style={{ fontWeight: 700, color: '#059669' }}>
                            {kc.desaTerlapor} / {kc.desaCount} ({pct}%)
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: '#059669',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* LEVEL 2: DRILL-DOWN KECAMATAN (DETAIL STATUS DESA DI BULUKUMBA) */}
          {selectedKecId && activeKec && (
            <div>
              <div className="drilldown-header">
                <button
                  onClick={() => setSelectedKecId(null)}
                  className="back-btn"
                >
                  <ArrowLeft size={15} /> Kembali ke Ringkasan {singleKab.namaKabupaten}
                </button>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    Kecamatan {activeKec.namaKecamatan} ({singleKab.namaKabupaten})
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Rincian Status Seluruh Desa / Kelurahan &bull; Single Source of Truth
                  </span>
                </div>
              </div>

              {/* Kecamatan KPI Cards */}
              <div className="metrics-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total DPT Kecamatan</h3>
                    <div className="value" style={{ color: 'var(--accent-primary)' }}>
                      {activeKec.totalDpt.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <Users size={22} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total TPS Kecamatan</h3>
                    <div className="value" style={{ color: 'var(--accent-secondary)' }}>
                      {activeKec.totalTps.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-secondary)' }}>
                    <Building2 size={22} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Kelengkapan Desa</h3>
                    <div className="value" style={{ color: 'var(--accent-emerald)' }}>
                      {activeKec.desaTerlapor} / {activeKec.desaCount}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeKec.desaCount > 0
                        ? Math.round((activeKec.desaTerlapor / activeKec.desaCount) * 100)
                        : 0}
                      % desa terdata
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)' }}>
                    <CheckCircle size={22} />
                  </div>
                </div>
              </div>

              {/* Desa Table */}
              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      Daftar Status {activeKec.desasList.length} Desa / Kelurahan di Kec. {activeKec.namaKecamatan}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total DPT Teragregasi: <strong>{activeKec.totalDpt.toLocaleString('id-ID')}</strong> &bull; Total
                      TPS: <strong>{activeKec.totalTps}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(5, 150, 105, 0.1)',
                        color: '#047857',
                        border: '1px solid rgba(5, 150, 105, 0.3)',
                      }}
                    >
                      ✓ {activeKec.desaTerlapor} Terisi Riil
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(217, 119, 6, 0.1)',
                        color: '#b45309',
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                      }}
                    >
                      ⚠️ {activeKec.desaBelumMasuk} Data Belum Masuk
                    </span>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID Desa</th>
                        <th>Nama Desa / Kelurahan</th>
                        <th>Status Nilai</th>
                        <th style={{ textAlign: 'right' }}>Jumlah DPT</th>
                        <th style={{ textAlign: 'right' }}>Jumlah TPS</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeKec.desasList.map((d) => {
                        const isNull = d.jumlahDpt === null || d.jumlahDpt === undefined;
                        return (
                          <tr key={d.desaId}>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.desaId}</td>
                            <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>Desa/Kel. {d.namaDesa}</td>
                            <td>
                              {isNull ? (
                                <span
                                  className="badge"
                                  style={{
                                    background: 'rgba(217, 119, 6, 0.1)',
                                    color: '#b45309',
                                    border: '1px solid rgba(217, 119, 6, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <AlertTriangle size={12} /> Data Belum Masuk
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
                                    gap: '0.3rem',
                                  }}
                                >
                                  <CheckCircle size={12} /> Terisi Angka Riil
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {isNull ? (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              ) : (
                                <span style={{ color: 'var(--accent-primary)' }}>
                                  {d.jumlahDpt?.toLocaleString('id-ID')}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {isNull ? (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              ) : (
                                <span style={{ color: 'var(--accent-secondary)' }}>
                                  {d.jumlahTps?.toLocaleString('id-ID')}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {onNavigateToInputDesa && (
                                <button
                                  onClick={() => onNavigateToInputDesa(d.desaId)}
                                  style={{
                                    background: isNull ? 'rgba(217, 119, 6, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                    border: `1px solid ${isNull ? 'rgba(217, 119, 6, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                                    color: isNull ? '#b45309' : 'var(--accent-primary)',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <ExternalLink size={12} />
                                  {isNull ? 'Input Sekarang' : 'Edit Nilai'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MULTI KABUPATEN (JIKA LEBIH DARI 1 KABUPATEN AKTIF)               */}
      {/* ========================================================================= */}
      {!isSingleKab && (
        <>
          {/* LEVEL 1: KOMPARASI MULTI KABUPATEN + GEO HEATMAP */}
          {!selectedKabId && (
            <>
              {/* 1. Global Executive KPI Cards */}
              <div className="metrics-grid">
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total DPT Gabungan</h3>
                    <div className="value" style={{ color: 'var(--accent-primary)' }}>
                      {stats.totalDpt.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pemilih Terdaftar di Seluruh Wilayah
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <Users size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total TPS Riil</h3>
                    <div className="value" style={{ color: 'var(--accent-secondary)' }}>
                      {stats.totalTps.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tempat Pemungutan Suara
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-secondary)' }}>
                    <Building2 size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Rata-rata Pemilih / TPS</h3>
                    <div className="value" style={{ color: 'var(--accent-emerald)' }}>
                      {avgDptPerTps.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Beban Pemilih per Titik TPS
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)' }}>
                    <Vote size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info" style={{ width: '100%', paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Kelengkapan Data Desa</h3>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {stats.progressPercent}%
                      </span>
                    </div>
                    <div className="value" style={{ fontSize: '1.75rem' }}>
                      {stats.desaTerlapor}{' '}
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        / {stats.totalDesa} Desa
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '999px',
                        marginTop: '0.5rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(stats.progressPercent, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <CheckCircle size={24} />
                  </div>
                </div>
              </div>

              {/* 2. Interactive Geo Heatmap Component */}
              <div className="map-section">
                <div className="map-section-title">
                  <MapPin size={18} color="var(--accent-primary)" />
                  Peta Distribusi 3 Kabupaten
                </div>
                <GeoHeatmap
                  stats={stats}
                  onSelectKabupaten={(kabId) => setSelectedKabId(kabId)}
                  onSelectKecamatan={(kabId, kecId) => {
                    setSelectedKabId(kabId);
                    setSelectedKecId(kecId);
                  }}
                />
              </div>

              {/* 3. Hero Kabupaten Comparative Cards */}
              <div className="section-header">
                <h3>Komparasi Antar Kabupaten</h3>
                <p>Pilih kartu kabupaten untuk membuka rincian per kecamatan dan desa.</p>
              </div>

              <div className="kecamatan-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {stats.byKabupaten.map((kab) => {
                  const accent = KABUPATEN_COLORS[kab.kabupatenId] || 'var(--accent-primary)';
                  return (
                    <div
                      key={kab.kabupatenId}
                      className="glass-panel"
                      style={{
                        padding: '1.5rem',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: `4px solid ${accent}`,
                      }}
                      onClick={() => setSelectedKabId(kab.kabupatenId)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              color: accent,
                              textTransform: 'uppercase',
                            }}
                          >
                            Kabupaten [{kab.kabupatenId}]
                          </span>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem' }}>
                            {kab.namaKabupaten}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKabId(kab.kabupatenId);
                          }}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                          }}
                        >
                          Drill-down <ChevronRight size={13} />
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem',
                          marginTop: '1.25rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total DPT Riil</span>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {kab.totalDpt.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total TPS</span>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                            {kab.totalTps.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Kelengkapan Desa:</span>
                          <span style={{ fontWeight: 700, color: accent }}>
                            {kab.desaTerlapor} / {kab.totalDesa} ({kab.progressPercent}%)
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(kab.progressPercent, 100)}%`,
                              height: '100%',
                              background: accent,
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. Comparative Charts & Leaderboard Row */}
              <div className="charts-grid">
                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <Layers size={18} color="var(--accent-primary)" />
                      Komparasi DPT Riil Antar Kabupaten
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            color: '#0f172a',
                          }}
                          formatter={(val: any) => [val.toLocaleString('id-ID') + ' Pemilih', 'Total DPT']}
                        />
                        <Bar
                          dataKey="totalDpt"
                          name="Total DPT"
                          fill="var(--accent-primary)"
                          radius={[6, 6, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => setSelectedKabId(entry.kabupatenId)}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <Award size={18} color="var(--accent-amber)" />
                      Top 5 Kecamatan Terpadat
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Peringkat</th>
                          <th>Kecamatan</th>
                          <th>Kabupaten</th>
                          <th style={{ textAlign: 'right' }}>Total DPT</th>
                          <th>Kelengkapan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topKecamatan.map((kc, idx) => {
                          const kab = stats.byKabupaten.find((k) => k.kabupatenId === kc.kabupatenId);
                          const pct = kc.desaCount > 0 ? Math.round((kc.desaTerlapor / kc.desaCount) * 100) : 0;
                          return (
                            <tr
                              key={kc.kecamatanId}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedKabId(kc.kabupatenId);
                                setSelectedKecId(kc.kecamatanId);
                              }}
                            >
                              <td style={{ fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)' }}>
                                #{idx + 1}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                Kec. {kc.namaKecamatan}
                              </td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {kab?.namaKabupaten.replace('Kabupaten ', '')}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                {kc.totalDpt.toLocaleString('id-ID')}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <div
                                    style={{
                                      width: '45px',
                                      height: '5px',
                                      background: 'var(--bg-secondary)',
                                      borderRadius: '999px',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: pct === 100 ? '#059669' : '#4f46e5',
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LEVEL 2: DRILL-DOWN KABUPATEN */}
          {selectedKabId && !selectedKecId && activeKab && (
            <div>
              <div className="drilldown-header">
                <button
                  onClick={() => setSelectedKabId(null)}
                  className="back-btn"
                >
                  <ArrowLeft size={15} /> Kembali ke Komparasi
                </button>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    Analisis Wilayah: {activeKab.namaKabupaten}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Menampilkan {activeKab.kecamatanList.length} Kecamatan
                  </span>
                </div>
              </div>

              <div className="metrics-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total DPT {activeKab.namaKabupaten}</h3>
                    <div className="value" style={{ color: 'var(--accent-primary)' }}>
                      {activeKab.totalDpt.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-primary)' }}>
                    <Users size={22} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Total TPS Riil</h3>
                    <div className="value" style={{ color: 'var(--accent-secondary)' }}>
                      {activeKab.totalTps.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-secondary)' }}>
                    <Building2 size={22} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div className="metric-info">
                    <h3>Kelengkapan Desa</h3>
                    <div className="value" style={{ color: 'var(--accent-emerald)' }}>
                      {activeKab.desaTerlapor} / {activeKab.totalDesa}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeKab.progressPercent}% desa terisi
                    </span>
                  </div>
                  <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)' }}>
                    <CheckCircle size={22} />
                  </div>
                </div>
              </div>

              <div className="charts-grid" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <Layers size={18} color="var(--accent-primary)" />
                      Grafik DPT per Kecamatan di {activeKab.namaKabupaten}
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...activeKab.kecamatanList].sort((a, b) => b.totalDpt - a.totalDpt)}
                        margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="namaKecamatan" stroke="#64748b" tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            color: '#0f172a',
                          }}
                          formatter={(val: any) => [val.toLocaleString('id-ID') + ' Pemilih', 'Total DPT']}
                        />
                        <Bar
                          dataKey="totalDpt"
                          name="Total DPT"
                          fill="var(--accent-primary)"
                          radius={[6, 6, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => setSelectedKecId(entry.kecamatanId)}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel chart-card">
                  <div className="chart-header">
                    <div className="chart-title">
                      <MapPin size={18} color="var(--accent-secondary)" />
                      Pilih Kecamatan
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      padding: '0.5rem 0',
                    }}
                  >
                    {activeKab.kecamatanList.map((kc) => (
                      <div
                        key={kc.kecamatanId}
                        onClick={() => setSelectedKecId(kc.kecamatanId)}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Kec. {kc.namaKecamatan}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, marginTop: '0.25rem' }}>
                          {kc.totalDpt.toLocaleString('id-ID')} DPT &bull; {kc.totalTps} TPS
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.5rem',
                          }}
                        >
                          <span>Desa Masuk:</span>
                          <span style={{ fontWeight: 600, color: kc.desaBelumMasuk > 0 ? '#d97706' : '#059669' }}>
                            {kc.desaTerlapor}/{kc.desaCount} Terdata
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 3: DRILL-DOWN KECAMATAN MULTI KAB */}
          {selectedKabId && selectedKecId && activeKab && activeKec && (
            <div>
              <div className="drilldown-header">
                <button
                  onClick={() => setSelectedKecId(null)}
                  className="back-btn"
                >
                  <ArrowLeft size={15} /> Kembali ke {activeKab.namaKabupaten}
                </button>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    Kecamatan {activeKec.namaKecamatan} ({activeKab.namaKabupaten})
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Rincian Status Seluruh Desa / Kelurahan
                  </span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      Daftar Status {activeKec.desasList.length} Desa / Kelurahan
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total DPT Teragregasi: <strong>{activeKec.totalDpt.toLocaleString('id-ID')}</strong> &bull; Total
                      TPS: <strong>{activeKec.totalTps}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(5, 150, 105, 0.1)',
                        color: '#047857',
                        border: '1px solid rgba(5, 150, 105, 0.3)',
                      }}
                    >
                      ✓ {activeKec.desaTerlapor} Terisi Riil
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(217, 119, 6, 0.1)',
                        color: '#b45309',
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                      }}
                    >
                      ⚠️ {activeKec.desaBelumMasuk} Data Belum Masuk
                    </span>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID Desa</th>
                        <th>Nama Desa / Kelurahan</th>
                        <th>Status Nilai</th>
                        <th style={{ textAlign: 'right' }}>Jumlah DPT</th>
                        <th style={{ textAlign: 'right' }}>Jumlah TPS</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeKec.desasList.map((d) => {
                        const isNull = d.jumlahDpt === null || d.jumlahDpt === undefined;
                        return (
                          <tr key={d.desaId}>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.desaId}</td>
                            <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>Desa/Kel. {d.namaDesa}</td>
                            <td>
                              {isNull ? (
                                <span
                                  className="badge"
                                  style={{
                                    background: 'rgba(217, 119, 6, 0.1)',
                                    color: '#b45309',
                                    border: '1px solid rgba(217, 119, 6, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <AlertTriangle size={12} /> Data Belum Masuk
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
                                    gap: '0.3rem',
                                  }}
                                >
                                  <CheckCircle size={12} /> Terisi Angka Riil
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {isNull ? (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              ) : (
                                <span style={{ color: 'var(--accent-primary)' }}>
                                  {d.jumlahDpt?.toLocaleString('id-ID')}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {isNull ? (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              ) : (
                                <span style={{ color: 'var(--accent-secondary)' }}>
                                  {d.jumlahTps?.toLocaleString('id-ID')}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {onNavigateToInputDesa && (
                                <button
                                  onClick={() => onNavigateToInputDesa(d.desaId)}
                                  style={{
                                    background: isNull ? 'rgba(217, 119, 6, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                    border: `1px solid ${isNull ? 'rgba(217, 119, 6, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                                    color: isNull ? '#b45309' : 'var(--accent-primary)',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  <ExternalLink size={12} />
                                  {isNull ? 'Input Sekarang' : 'Edit Nilai'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
