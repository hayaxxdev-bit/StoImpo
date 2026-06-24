import React, { useState, useRef, useCallback } from 'react';
import { Upload, CloudUpload, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { getFileInfo, formatFileSize } from '../utils/github';
import FileIcon from './FileIcon';

export default function DropZone({ github, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const inputRef = useRef();

  const processFiles = useCallback(async (files) => {
    const fileArr = Array.from(files);
    const newUploads = fileArr.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending',
      progress: 0,
      ...getFileInfo(f.name, f.type),
    }));
    
    setUploads(prev => [...prev, ...newUploads]);

    for (const u of newUploads) {
      setUploads(prev => prev.map(x => x.id === u.id ? { ...x, status: 'uploading' } : x));
      try {
        await github.uploadFile(u.file, (progress) => {
          setUploads(prev => prev.map(x => x.id === u.id ? { ...x, progress } : x));
        });
        setUploads(prev => prev.map(x => x.id === u.id ? { ...x, status: 'done', progress: 100 } : x));
        onUploaded();
      } catch (err) {
        setUploads(prev => prev.map(x => x.id === u.id ? { ...x, status: 'error', error: err.message } : x));
      }
    }
  }, [github, onUploaded]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeUpload = (id) => setUploads(prev => prev.filter(x => x.id !== id));
  const clearDone = () => setUploads(prev => prev.filter(x => x.status !== 'done'));

  const hasDone = uploads.some(u => u.status === 'done');

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3B82F6' : 'rgba(59,130,246,0.25)'}`,
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging 
            ? 'rgba(59,130,246,0.08)' 
            : 'rgba(15,22,41,0.4)',
          transition: 'all 0.25s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated bg ring */}
        <div style={{
          position: 'absolute', inset: 0, 
          background: dragging ? 'radial-gradient(circle at center, rgba(59,130,246,0.1) 0%, transparent 70%)' : 'transparent',
          transition: 'all 0.3s',
          pointerEvents: 'none',
        }} />
        
        <div style={{
          width: '72px', height: '72px',
          background: dragging ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          transition: 'all 0.25s',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          {dragging 
            ? <CloudUpload size={32} color="#3B82F6" />
            : <Upload size={32} color="#3B82F6" />
          }
        </div>
        
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F8FAFF', fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
          {dragging ? 'Lepaskan file disini!' : 'Drag & Drop file kamu'}
        </h3>
        <p style={{ color: '#64748B', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: '0 0 16px' }}>
          atau klik untuk memilih file
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
          {['PDF', 'Word', 'Excel', 'Gambar', 'Video', 'Audio', 'ZIP', 'Semua jenis'].map(t => (
            <span key={t} style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#94A3B8',
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '20px',
              fontFamily: 'Inter, sans-serif',
            }}>{t}</span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={e => processFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
              {uploads.length} file
            </span>
            {hasDone && (
              <button onClick={clearDone} style={{
                background: 'none', border: 'none', color: '#64748B', fontSize: '12px',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                Bersihkan selesai
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {uploads.map(u => (
              <div key={u.id} style={{
                background: 'rgba(15,22,41,0.6)',
                border: `1px solid ${u.status === 'error' ? 'rgba(239,68,68,0.3)' : u.status === 'done' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.15)'}`,
                borderRadius: '12px',
                padding: '12px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <FileIcon category={u.category} color={u.color} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      color: '#F8FAFF', fontSize: '13px', fontFamily: 'Inter, sans-serif',
                      fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}>{u.name}</span>
                    <span style={{ color: '#64748B', fontSize: '11px', fontFamily: 'Inter, sans-serif', marginLeft: '8px', flexShrink: 0 }}>
                      {formatFileSize(u.size)}
                    </span>
                  </div>
                  
                  {u.status === 'uploading' && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${u.progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}
                  
                  {u.status === 'error' && (
                    <div style={{ color: '#F87171', fontSize: '11px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                      {u.error}
                    </div>
                  )}
                </div>
                
                <div style={{ flexShrink: 0 }}>
                  {u.status === 'uploading' && <Loader2 size={16} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />}
                  {u.status === 'done' && <CheckCircle size={16} color="#10B981" />}
                  {u.status === 'error' && <AlertCircle size={16} color="#EF4444" />}
                  {u.status === 'pending' && (
                    <button onClick={() => removeUpload(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' }}>
                      <X size={16} color="#64748B" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
