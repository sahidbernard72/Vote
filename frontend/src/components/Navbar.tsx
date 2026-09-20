import React, { useState, useEffect } from 'react';
import { Layers, BarChart3, Edit3, Table2, Database, Sun, Moon } from 'lucide-react';
import type { ServerHealth } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'input' | 'table';
  setActiveTab: (tab: 'dashboard' | 'input' | 'table') => void;
  serverHealth: ServerHealth | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverHealth,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isServerOnline = !!serverHealth;
  const isDbConnected = serverHealth?.database?.connected;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-section">
          <div className="brand-icon">
            <Layers size={22} />
          </div>
          <div className="brand-text">
            <h1>Sistem Rekap DPT & TPS Wilayah</h1>
            <span>Kabupaten Bulukumba &bull; SSOT Agregasi Berjenjang</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={16} />
            Visualisasi & Peta
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            <Edit3 size={16} />
            Input Rekap Desa
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Table2 size={16} />
            Data Rekapitulasi
          </button>
        </nav>

        <div className="navbar-status-actions">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <div
            className="status-pill"
            title={isServerOnline ? 'ElysiaJS Backend Aktif' : 'ElysiaJS Backend Tidak Terhubung'}
          >
            <span className={`status-dot ${isServerOnline ? 'online' : 'offline'}`} />
            <span>API: {isServerOnline ? 'Online' : 'Offline'}</span>
          </div>

          <div
            className="status-pill"
            style={{
              borderColor: isDbConnected ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)',
            }}
            title={serverHealth?.database?.message || 'Memeriksa koneksi MySQL...'}
          >
            <Database size={13} color={isDbConnected ? '#059669' : '#d97706'} />
            <span style={{ color: isDbConnected ? '#059669' : '#d97706' }}>
              MySQL: {isDbConnected ? 'Connected' : 'Mock Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
