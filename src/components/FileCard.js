import React, { useState } from 'react';
import { Download, Trash2, ExternalLink, Eye } from 'lucide-react';
import FileIcon from './FileIcon';
import { getFileInfo, formatFileSize, formatDate } from '../utils/github';

export default function FileCard({ file, onDelete, view = 'grid' }) {
  const [hovering, setHovering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const info = getFileInfo(file.name, file.type);
  const isImage = info.category === 'image';

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await onDelete(file);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (view === 'list') {
    return (
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setConfirmDelete(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          background: hovering ? 'rgba(59,130,246,0.05)' : 'rgba(15,22,41,0.4)',
          border: '1px solid rgba(59,130,246,0.1)',
          borderRadius: '12px', padding: '14px 16px',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: '40px', height: '40px', flexShrink: 0,
          background: `${info.color}18`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileIcon category={info.category} color={info.color} size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, color: '#F8FAFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.originalName || file.name}
          </p>
          <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            {info.label} · {formatFileSize(file.size)} {file.uploadedAt && '· ' + formatDate(file.uploadedAt)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <a href={file.downloadUrl} download target="_blank" rel="noreferrer">
            <ActionBtn icon={<Download size={15} />} title="Unduh" />
          </a>
          <a href={file.githubUrl} target="_blank" rel="noreferrer">
            <ActionBtn icon={<ExternalLink size={15} />} title="GitHub" />
          </a>
          <ActionBtn 
            icon={<Trash2 size={15} />} 
            title={confirmDelete ? 'Yakin?' : 'Hapus'}
            danger={confirmDelete}
            loading={deleting}
            onClick={handleDelete}
          />
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setConfirmDelete(false); }}
      style={{
        background: 'rgba(15,22,41,0.6)',
        border: `1px solid ${hovering ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.25s',
        transform: hovering ? 'translateY(-2px)' : 'none',
        boxShadow: hovering ? '0 8px 30px rgba(59,130,246,0.1)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Preview / Icon area */}
      <div style={{
        height: '120px',
        background: `linear-gradient(135deg, ${info.color}15, ${info.color}08)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isImage && file.downloadUrl ? (
          <img
            src={file.downloadUrl}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '56px', height: '56px',
            background: `${info.color}20`,
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${info.color}30`,
          }}>
            <FileIcon category={info.category} color={info.color} size={28} />
          </div>
        )}
        
        {/* Category badge */}
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          background: `${info.color}25`,
          border: `1px solid ${info.color}40`,
          color: info.color,
          fontSize: '10px', fontWeight: 600,
          padding: '2px 8px', borderRadius: '20px',
          fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '0.5px',
        }}>{info.label}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p title={file.originalName || file.name} style={{
          margin: '0 0 4px',
          color: '#F8FAFF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {file.originalName || file.name}
        </p>
        <p style={{ margin: '0 0 12px', color: '#4B5563', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
          {formatFileSize(file.size)}
          {file.uploadedAt && <span> · {formatDate(file.uploadedAt)}</span>}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
          <a href={file.downloadUrl} download target="_blank" rel="noreferrer" style={{ flex: 1 }}>
            <button style={{
              width: '100%', padding: '7px 0',
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '8px',
              color: '#3B82F6',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.2s',
            }}>
              <Download size={13} /> Unduh
            </button>
          </a>
          <a href={file.githubUrl} target="_blank" rel="noreferrer">
            <ActionBtn icon={<ExternalLink size={14} />} title="" />
          </a>
          <ActionBtn 
            icon={<Trash2 size={14} />}
            title=""
            danger={confirmDelete}
            loading={deleting}
            onClick={handleDelete}
          />
        </div>
        {confirmDelete && (
          <p style={{ margin: '8px 0 0', color: '#F87171', fontSize: '11px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            Klik lagi untuk konfirmasi hapus
          </p>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, danger, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading}
      style={{
        padding: '7px 10px',
        background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '8px',
        color: danger ? '#F87171' : '#64748B',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {icon}
    </button>
  );
}
