import React, { useState, useEffect, useCallback } from 'react';
import { 
  Github, Settings, RefreshCw, Grid3X3, List, Search,
  Upload, Folder, X, LogOut, Cloud, FileText, Image, 
  Film, Music, Archive, Plus, ChevronDown
} from 'lucide-react';
import SetupModal from './components/SetupModal';
import DropZone from './components/DropZone';
import FileCard from './components/FileCard';
import { GitHubStorage, getFileInfo, config } from './utils/github';

const CATEGORIES = [
  { id: 'all', label: 'Semua File', icon: <Folder size={16} /> },
  { id: 'image', label: 'Gambar', icon: <Image size={16} /> },
  { id: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { id: 'word', label: 'Word', icon: <FileText size={16} /> },
  { id: 'excel', label: 'Excel', icon: <FileText size={16} /> },
  { id: 'video', label: 'Video', icon: <Film size={16} /> },
  { id: 'audio', label: 'Audio', icon: <Music size={16} /> },
  { id: 'archive', label: 'Arsip', icon: <Archive size={16} /> },
  { id: 'other', label: 'Lainnya', icon: <Folder size={16} /> },
];

export default function App() {
  const [github, setGithub] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deleting, setDeleting] = useState(null);

  // Auto-connect jika sudah ada config tersimpan
  useEffect(() => {
    const saved = config.load();
    if (saved.token && saved.owner && saved.repo) {
      const gh = new GitHubStorage(saved.token, saved.owner, saved.repo);
      gh.validate().then(result => {
        if (result.valid) {
          setGithub(gh);
          setRepoInfo(result.repo);
        } else {
          setShowSetup(true);
        }
      });
    } else {
      setShowSetup(true);
    }
  }, []);

  const loadFiles = useCallback(async () => {
    if (!github) return;
    setLoading(true);
    try {
      const list = await github.listFiles();
      setFiles(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [github]);

  useEffect(() => {
    if (github) loadFiles();
  }, [github, loadFiles]);

  const handleConnected = (gh, repo) => {
    setGithub(gh);
    setRepoInfo(repo);
    setShowSetup(false);
  };

  const handleDisconnect = () => {
    config.clear();
    setGithub(null);
    setRepoInfo(null);
    setFiles([]);
    setShowSetup(true);
  };

  const handleDelete = async (file) => {
    setDeleting(file.id);
    try {
      await github.deleteFile(file.path, file.sha);
      await loadFiles();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
    setDeleting(null);
  };

  // Filter & sort
  const filtered = files
    .filter(f => {
      const info = getFileInfo(f.name, f.type);
      const matchCat = category === 'all' || info.category === category;
      const matchSearch = !search || (f.originalName || f.name).toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.originalName || a.name).localeCompare(b.originalName || b.name);
      if (sortBy === 'size') return b.size - a.size;
      return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
    });

  const categoryCounts = {};
  files.forEach(f => {
    const info = getFileInfo(f.name, f.type);
    categoryCounts[info.category] = (categoryCounts[info.category] || 0) + 1;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#F8FAFF', fontFamily: 'Inter, sans-serif' }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.04) 0%, transparent 60%)',
      }} />

      {showSetup && <SetupModal onSuccess={handleConnected} />}

      {/* Layout */}
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        
        {/* Sidebar */}
        <aside style={{
          width: '240px', flexShrink: 0,
          background: 'rgba(13,19,33,0.9)',
          borderRight: '1px solid rgba(59,130,246,0.1)',
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(59,130,246,0.3)',
              }}>
                <Cloud size={20} color="white" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, margin: 0, color: '#F8FAFF' }}>
                  FileShare
                </h1>
                <p style={{ fontSize: '11px', color: '#4B5563', margin: 0 }}>Hub</p>
              </div>
            </div>
          </div>

          {/* Repo info */}
          {repoInfo && (
            <div style={{ padding: '12px 16px', margin: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Github size={12} color="#3B82F6" />
                <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>TERHUBUNG</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {repoInfo.full_name}
              </p>
              <p style={{ fontSize: '11px', color: '#4B5563', margin: '2px 0 0' }}>
                {files.length} file tersimpan
              </p>
            </div>
          )}

          {/* Upload Button */}
          <div style={{ padding: '0 12px 12px' }}>
            <button
              onClick={() => setShowUpload(u => !u)}
              style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600, fontSize: '14px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
              }}
            >
              <Plus size={16} /> Upload File
            </button>
          </div>

          {/* Categories */}
          <nav style={{ padding: '0 8px', flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#374151', fontWeight: 600, letterSpacing: '1px', padding: '8px 8px 4px', fontFamily: 'Space Grotesk, sans-serif' }}>
              KATEGORI
            </p>
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? files.length : (categoryCounts[cat.id] || 0);
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    width: '100%', padding: '8px 10px',
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.25)' : 'transparent'}`,
                    borderRadius: '8px', marginBottom: '2px',
                    color: active ? '#3B82F6' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                  }}
                >
                  {cat.icon}
                  <span style={{ flex: 1 }}>{cat.label}</span>
                  {count > 0 && (
                    <span style={{
                      background: active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#3B82F6' : '#4B5563',
                      fontSize: '10px', fontWeight: 600,
                      padding: '1px 6px', borderRadius: '10px',
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
            <button onClick={loadFiles} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>
              <RefreshCw size={13} /> Segarkan
            </button>
            <button onClick={handleDisconnect} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
              <LogOut size={13} /> Ganti Akun
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* Top Bar */}
          <header style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(59,130,246,0.08)',
            display: 'flex', alignItems: 'center', gap: '16px',
            background: 'rgba(13,19,33,0.6)',
            backdropFilter: 'blur(10px)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} color="#4B5563" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari file..."
                style={{
                  width: '100%', padding: '9px 12px 9px 38px',
                  background: 'rgba(15,22,41,0.6)',
                  border: '1px solid rgba(59,130,246,0.12)',
                  borderRadius: '10px', color: '#F8FAFF',
                  fontFamily: 'Inter, sans-serif', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Sort */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  appearance: 'none',
                  background: 'rgba(15,22,41,0.6)',
                  border: '1px solid rgba(59,130,246,0.12)',
                  borderRadius: '10px',
                  padding: '9px 32px 9px 12px',
                  color: '#94A3B8',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="date">Terbaru</option>
                <option value="name">Nama</option>
                <option value="size">Ukuran</option>
              </select>
              <ChevronDown size={14} color="#4B5563" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: 'rgba(15,22,41,0.6)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '10px', overflow: 'hidden' }}>
              {[['grid', <Grid3X3 size={16} />], ['list', <List size={16} />]].map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 12px',
                    background: viewMode === mode ? 'rgba(59,130,246,0.2)' : 'transparent',
                    border: 'none', color: viewMode === mode ? '#3B82F6' : '#4B5563',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </header>

          <div style={{ padding: '28px', flex: 1 }}>
            
            {/* Upload Panel */}
            {showUpload && (
              <div style={{
                marginBottom: '24px',
                background: 'rgba(13,19,33,0.8)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={18} color="#3B82F6" /> Upload File Baru
                  </h2>
                  <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex' }}>
                    <X size={18} />
                  </button>
                </div>
                <DropZone github={github} onUploaded={() => { loadFiles(); }} />
              </div>
            )}

            {/* Page Title */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, margin: 0, color: '#F8FAFF' }}>
                  {CATEGORIES.find(c => c.id === category)?.label || 'Semua File'}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#4B5563', fontSize: '14px' }}>
                  {loading ? 'Memuat...' : `${filtered.length} file ditemukan`}
                </p>
              </div>
              {repoInfo && (
                <a
                  href={repoInfo.html_url + '/tree/main/files'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#4B5563', fontSize: '12px', textDecoration: 'none',
                    background: 'rgba(15,22,41,0.4)',
                    border: '1px solid rgba(59,130,246,0.1)',
                    padding: '6px 12px', borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s',
                  }}
                >
                  <Github size={13} /> Lihat di GitHub
                </a>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gap: '12px',
              }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    height: viewMode === 'grid' ? '200px' : '64px',
                    background: 'rgba(59,130,246,0.04)',
                    border: '1px solid rgba(59,130,246,0.08)',
                    borderRadius: '16px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{
                  width: '80px', height: '80px',
                  background: 'rgba(59,130,246,0.08)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '1px solid rgba(59,130,246,0.15)',
                }}>
                  <Folder size={36} color="#3B82F6" />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F8FAFF', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
                  {search ? 'File tidak ditemukan' : 'Belum ada file'}
                </h3>
                <p style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
                  {search ? `Tidak ada hasil untuk "${search}"` : 'Upload file pertama kamu dan mulai berbagi!'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowUpload(true)}
                    style={{
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                      border: 'none', borderRadius: '12px',
                      color: 'white', fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Upload size={18} /> Upload File Sekarang
                  </button>
                )}
              </div>
            )}

            {/* File Grid / List */}
            {!loading && filtered.length > 0 && (
              <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gap: '12px',
              }}>
                {filtered.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    view={viewMode}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0B1120; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 3px; }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        select option { background: #131A2E; }
      `}</style>
    </div>
  );
}
