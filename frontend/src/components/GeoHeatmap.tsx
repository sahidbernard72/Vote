import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { MapPin, ExternalLink } from 'lucide-react';
import type { RekapStats } from '../types';

interface GeoHeatmapProps {
  stats: RekapStats;
  onSelectKabupaten: (kabupatenId: string) => void;
  onSelectKecamatan?: (kabupatenId: string, kecamatanId: string) => void;
}

// Coordinates for the 3 regencies and all 31 districts
const REGION_COORDINATES: Record<
  string,
  {
    name: string;
    lat: number;
    lng: number;
    districts: Record<string, { lat: number; lng: number }>;
  }
> = {
  BLK: {
    name: 'Kabupaten Bulukumba',
    lat: -5.55,
    lng: 120.19,
    districts: {
      B001: { lat: -5.51, lng: 120.14 }, // Gantarang
      B002: { lat: -5.56, lng: 120.195 }, // Ujung Bulu
      B003: { lat: -5.62, lng: 120.48 }, // Bonto Bahari
      B004: { lat: -5.46, lng: 120.44 }, // Bonto Tiro
      B005: { lat: -5.40, lng: 120.41 }, // Herlang
      B006: { lat: -5.33, lng: 120.37 }, // Kajang
      B007: { lat: -5.36, lng: 120.18 }, // Bulukumpa
      B008: { lat: -5.44, lng: 119.98 }, // Kindang
      B009: { lat: -5.53, lng: 120.28 }, // Ujung Loe
      B010: { lat: -5.42, lng: 120.12 }, // Rilau Ale
    },
  },
  BRU: {
    name: 'Kabupaten Barru',
    lat: -4.423,
    lng: 119.645,
    districts: {
      R001: { lat: -4.32, lng: 119.64 }, // Balusu
      R002: { lat: -4.42, lng: 119.64 }, // Barru
      R003: { lat: -4.18, lng: 119.62 }, // Mallusetasi
      R004: { lat: -4.62, lng: 119.82 }, // Pujananting
      R005: { lat: -4.26, lng: 119.63 }, // Soppeng Riaja
      R006: { lat: -4.47, lng: 119.78 }, // Tanete Riaja
      R007: { lat: -4.48, lng: 119.61 }, // Tanete Rilau
    },
  },
  MRS: {
    name: 'Kabupaten Maros',
    lat: -5.004,
    lng: 119.574,
    districts: {
      M001: { lat: -5.08, lng: 119.56 }, // Mandai
      M002: { lat: -5.004, lng: 119.574 }, // Turikale
      M003: { lat: -5.09, lng: 119.50 }, // Marusu
      M004: { lat: -4.98, lng: 119.67 }, // Bantimurung
      M005: { lat: -4.91, lng: 119.53 }, // Bontoa
      M006: { lat: -5.12, lng: 119.64 }, // Tanralili
      M007: { lat: -4.97, lng: 119.53 }, // Maros Baru
      M008: { lat: -4.95, lng: 119.56 }, // Lau
      M009: { lat: -5.02, lng: 119.66 }, // Simbang
      M010: { lat: -5.15, lng: 119.53 }, // Moncongloe
      M011: { lat: -5.18, lng: 119.72 }, // Tompobulu
      M012: { lat: -4.95, lng: 119.79 }, // Cenrana
      M013: { lat: -4.88, lng: 119.86 }, // Camba
      M014: { lat: -4.78, lng: 119.89 }, // Mallawa
    },
  },
};

function getHeatColor(dpt: number): string {
  if (dpt > 15000) return '#4f46e5'; // Deep Indigo (Highest)
  if (dpt > 8000) return '#0284c7'; // Cyan/Sky (Moderate-High)
  if (dpt > 0) return '#059669'; // Emerald (Moderate-Low)
  return '#d97706'; // Amber (Belum Ada Data / 0)
}

function getRadius(dpt: number): number {
  if (dpt > 20000) return 26;
  if (dpt > 10000) return 20;
  if (dpt > 5000) return 16;
  if (dpt > 0) return 12;
  return 9;
}

export const GeoHeatmap: React.FC<GeoHeatmapProps> = ({
  stats,
  onSelectKabupaten,
  onSelectKecamatan,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Geo Heatmap Kepadatan DPT Kabupaten Bulukumba
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Visualisasi spasial sebaran DPT & TPS di 10 Kecamatan Kabupaten Bulukumba. Klik marker kecamatan untuk melihat rincian desa.
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--bg-secondary)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f46e5' }} />
            <span>&gt; 35.000 (Sangat Padat)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
            <span>25.000 - 35.000 (Sedang)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }} />
            <span>&lt; 25.000 (Rendah)</span>
          </div>
        </div>
      </div>

      <div className="geo-map-container">
        <MapContainer
          center={[-5.50, 120.22]}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Tile Layer (Clean & Free) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. Big Hub Markers for the 3 Kabupaten */}
          {stats.byKabupaten.map((kab) => {
            const coord = REGION_COORDINATES[kab.kabupatenId];
            if (!coord) return null;

            return (
              <CircleMarker
                key={`kab-${kab.kabupatenId}`}
                center={[coord.lat, coord.lng]}
                radius={28}
                pathOptions={{
                  fillColor: '#4f46e5',
                  fillOpacity: 0.25,
                  color: '#4f46e5',
                  weight: 3,
                  dashArray: '4, 4',
                }}
              >
                <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                  <div style={{ padding: '0.2rem' }}>
                    <strong>{kab.namaKabupaten}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {kab.totalDpt.toLocaleString('id-ID')} DPT &bull; {kab.totalTps} TPS
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* 2. District / Kecamatan Heat Circle Markers */}
          {stats.byKabupaten.flatMap((kab) =>
            kab.kecamatanList.map((kc) => {
              const kabCoord = REGION_COORDINATES[kab.kabupatenId];
              const kecCoord = kabCoord?.districts[kc.kecamatanId];
              if (!kecCoord) return null;

              const heatColor = getHeatColor(kc.totalDpt);
              const radius = getRadius(kc.totalDpt);

              return (
                <CircleMarker
                  key={`kec-${kc.kecamatanId}`}
                  center={[kecCoord.lat, kecCoord.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: heatColor,
                    fillOpacity: 0.85,
                    color: '#ffffff',
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (onSelectKecamatan) {
                        onSelectKecamatan(kab.kabupatenId, kc.kecamatanId);
                      } else {
                        onSelectKabupaten(kab.kabupatenId);
                      }
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div style={{ textAlign: 'left', minWidth: '130px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Kec. {kc.namaKecamatan}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{kab.namaKabupaten}</div>
                      <div
                        style={{
                          marginTop: '0.35rem',
                          paddingTop: '0.35rem',
                          borderTop: '1px solid #e2e8f0',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div>
                          DPT: <strong>{kc.totalDpt > 0 ? kc.totalDpt.toLocaleString('id-ID') : '-'}</strong>
                        </div>
                        <div>
                          TPS: <strong>{kc.totalTps > 0 ? kc.totalTps.toLocaleString('id-ID') : '-'}</strong>
                        </div>
                        <div style={{ color: kc.desaBelumMasuk > 0 ? '#d97706' : '#059669' }}>
                          Desa: {kc.desaTerlapor}/{kc.desaCount} Terdata
                        </div>
                      </div>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div style={{ padding: '0.5rem', textAlign: 'left' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: heatColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        {kab.namaKabupaten}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.2rem 0 0.5rem' }}>
                        Kecamatan {kc.namaKecamatan}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' }}>
                        Total DPT: <strong>{kc.totalDpt.toLocaleString('id-ID')}</strong> &bull; Total TPS:{' '}
                        <strong>{kc.totalTps}</strong>
                        <br />
                        Kelengkapan Desa: {kc.desaTerlapor} dari {kc.desaCount} desa terisi riil.
                      </p>
                      <button
                        onClick={() => {
                          if (onSelectKecamatan) {
                            onSelectKecamatan(kab.kabupatenId, kc.kecamatanId);
                          } else {
                            onSelectKabupaten(kab.kabupatenId);
                          }
                        }}
                        style={{
                          width: '100%',
                          background: heatColor,
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ExternalLink size={13} />
                        Drill-down ke Kecamatan Ini
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })
          )}
        </MapContainer>
      </div>
    </div>
  );
};
