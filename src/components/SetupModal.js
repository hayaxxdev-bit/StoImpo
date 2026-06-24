import React, { useState } from 'react';
import { Github, Key, User, BookOpen, ArrowRight, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GitHubStorage, config } from '../utils/github';

export default function SetupModal({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => config.load());
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!form.token || !form.owner || !form.repo) {
      setError('Semua field wajib diisi');
      return;
    }
    setStatus('loading');
    setError('');
    const gh = new GitHubStorage(form.token, form.owner, form.repo);
    const result = await gh.validate();
    if (result.valid) {
      await gh.initRepo();
      config.save(form.token, form.owner, form.repo);
      setStatus('success');
      setTimeout(() => onSuccess(gh, result.repo), 800);
    } else {
      setStatus('error');
      setError(result.error || 'Validasi gagal');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#131A2E',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 0 60px rgba(59,130,246,0.15)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
          }}>
            <Github size={32} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, color: '#F8FAFF', margin: 0 }}>
            Hubungkan GitHub
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
            File kamu akan disimpan di GitHub Repository secara gratis
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>LANGKAH 1</span>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '13px', fontFamily: 'Inter, sans-serif', margin: 0 }}>
              Buat <strong style={{color:'#F8FAFF'}}>GitHub repository baru</strong> (bisa private/public) yang akan digunakan sebagai penyimpanan file.
            </p>
            <a href="https://github.com/new" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontSize: '13px', marginTop: '8px', textDecoration: 'none' }}>
              Buat Repository <ExternalLink size={12} />
            </a>
          </div>
          
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>LANGKAH 2</span>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '13px', fontFamily: 'Inter, sans-serif', margin: 0 }}>
              Buat <strong style={{color:'#F8FAFF'}}>Personal Access Token</strong> dengan scope <code style={{background:'rgba(6,182,212,0.15)',color:'#06B6D4',padding:'1px 6px',borderRadius:'4px'}}>repo</code> diaktifkan.
            </p>
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=FileShare+Hub" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontSize: '13px', marginTop: '8px', textDecoration: 'none' }}>
              Buat Token <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { key: 'token', icon: <Key size={16} />, placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', label: 'Personal Access Token', type: 'password' },
            { key: 'owner', icon: <User size={16} />, placeholder: 'username-github-kamu', label: 'Username GitHub', type: 'text' },
            { key: 'repo', icon: <BookOpen size={16} />, placeholder: 'nama-repository', label: 'Nama Repository', type: 'text' },
          ].map(({ key, icon, placeholder, label, type }) => (
            <div key={key}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', fontFamily: 'Space Grotesk, sans-serif', marginBottom: '6px', fontWeight: 500 }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }}>
                  {icon}
                </span>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    background: 'rgba(15,22,41,0.8)',
                    border: '1px solid rgba(75,85,99,0.5)',
                    borderRadius: '10px',
                    padding: '11px 12px 11px 38px',
                    color: '#F8FAFF',
                    fontFamily: 'Inter, monospace',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#F87171', fontSize: '13px' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleValidate}
          disabled={status === 'loading' || status === 'success'}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '13px',
            background: status === 'success' 
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'opacity 0.2s',
            opacity: status === 'loading' ? 0.8 : 1,
          }}
        >
          {status === 'loading' && <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
          {status === 'success' && <CheckCircle size={18} />}
          {status === 'success' ? 'Berhasil! Memuat...' : status === 'loading' ? 'Memvalidasi...' : (
            <><span>Mulai Sekarang</span><ArrowRight size={18} /></>
          )}
        </button>

        <p style={{ textAlign: 'center', color: '#4B5563', fontSize: '12px', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>
          🔒 Token disimpan lokal di browser kamu, tidak dikirim ke server manapun
        </p>
      </div>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
