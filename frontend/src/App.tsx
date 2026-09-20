import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { InputFormView } from './components/InputFormView';
import { TableView } from './components/TableView';
import { api } from './lib/api';
import type {
  PeriodeRekap,
  RekapStats,
  RekapDesaRow,
  ServerHealth,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'table'>('dashboard');
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);

  // Periodes & Active Selection
  const [periodes, setPeriodes] = useState<PeriodeRekap[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(1);

  // Targeted Desa for quick input/edit from drilldown or table
  const [targetDesaId, setTargetDesaId] = useState<string>('');

  // Data
  const [stats, setStats] = useState<RekapStats | null>(null);
  const [rekapList, setRekapList] = useState<RekapDesaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Health check
  const fetchHealth = async () => {
    try {
      const data = await api.checkHealth();
      setServerHealth(data);
    } catch {
      setServerHealth(null);
    }
  };

  // 2. Load Periodes
  const fetchPeriodes = async () => {
    try {
      const res = await api.getPeriodes();
      setPeriodes(res.data);
      if (res.data.length > 0 && !selectedPeriodeId) {
        setSelectedPeriodeId(res.data[0].id);
      }
    } catch (e) {
      console.error('Gagal memuat periode:', e);
    }
  };

  // 3. Load Rekap data & stats for selected periode
  const fetchRekapData = async (periodeId: number) => {
    setLoading(true);
    try {
      const [statsData, rekapData] = await Promise.allSettled([
        api.getStats(periodeId),
        api.getRekap(periodeId),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
      if (rekapData.status === 'fulfilled') {
        setRekapList(rekapData.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchPeriodes();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPeriodeId) {
      fetchRekapData(selectedPeriodeId);
    }
  }, [selectedPeriodeId]);

  const handleInputSuccess = () => {
    fetchRekapData(selectedPeriodeId);
    fetchHealth();
    setActiveTab('dashboard');
  };

  const handleQuickEditDesa = (desaId: string) => {
    setTargetDesaId(desaId);
    setActiveTab('input');
  };

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverHealth={serverHealth}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            periodes={periodes}
            selectedPeriodeId={selectedPeriodeId}
            onSelectPeriode={setSelectedPeriodeId}
            loading={loading}
            onRefresh={() => fetchRekapData(selectedPeriodeId)}
            onNavigateToInputDesa={handleQuickEditDesa}
          />
        )}

        {activeTab === 'input' && (
          <InputFormView
            periodes={periodes}
            selectedPeriodeId={selectedPeriodeId}
            initialDesaId={targetDesaId}
            onSuccess={handleInputSuccess}
          />
        )}

        {activeTab === 'table' && (
          <TableView
            rekapList={rekapList}
            periodes={periodes}
            selectedPeriodeId={selectedPeriodeId}
            onSelectPeriode={setSelectedPeriodeId}
            loading={loading}
            onRefresh={() => fetchRekapData(selectedPeriodeId)}
            onEditDesa={handleQuickEditDesa}
          />
        )}
      </main>
    </div>
  );
}

export default App;
