// GitHub API utility untuk penyimpanan file
// Semua file disimpan di GitHub repository sebagai backend gratis

const GITHUB_API = 'https://api.github.com';

export class GitHubStorage {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  // Validasi token dan repo
  async validate() {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}`, {
        headers: this.headers,
      });
      if (!res.ok) throw new Error('Repository tidak ditemukan atau token tidak valid');
      const data = await res.json();
      return { valid: true, repo: data };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  // Ambil semua file dari repo (dalam folder /files)
  async listFiles() {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/files`, {
        headers: this.headers,
      });
      if (res.status === 404) return []; // folder belum ada
      if (!res.ok) throw new Error('Gagal mengambil daftar file');
      const data = await res.json();
      
      // Ambil metadata dari file JSON terpisah
      const metaRes = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/metadata.json`, {
        headers: this.headers,
      });
      
      let metadata = {};
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const decoded = atob(metaData.content.replace(/\n/g, ''));
        metadata = JSON.parse(decoded);
      }

      return data
        .filter(f => f.type === 'file')
        .map(f => ({
          id: f.sha,
          name: f.name,
          size: f.size,
          downloadUrl: f.download_url,
          githubUrl: f.html_url,
          sha: f.sha,
          path: f.path,
          ...(metadata[f.name] || {}),
        }));
    } catch (err) {
      console.error('listFiles error:', err);
      return [];
    }
  }

  // Upload file ke GitHub
  async uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          onProgress?.(30);
          
          const base64 = e.target.result.split(',')[1];
          const path = `files/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          
          // Check jika file sudah ada
          let sha;
          try {
            const existing = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
              headers: this.headers,
            });
            if (existing.ok) {
              const data = await existing.json();
              sha = data.sha;
            }
          } catch {}

          onProgress?.(50);

          const body = {
            message: `Upload: ${file.name}`,
            content: base64,
            ...(sha ? { sha } : {}),
          };

          const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload gagal');
          }

          onProgress?.(80);

          const result = await res.json();
          
          // Update metadata
          await this.updateMetadata(file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), {
            originalName: file.name,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Pengguna',
            description: '',
          }, `files/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);

          onProgress?.(100);
          resolve(result.content);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // Hapus file dari GitHub
  async deleteFile(path, sha) {
    const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'DELETE',
      headers: this.headers,
      body: JSON.stringify({
        message: `Hapus: ${path}`,
        sha: sha,
      }),
    });
    if (!res.ok) throw new Error('Gagal menghapus file');
    return true;
  }

  // Update metadata file
  async updateMetadata(filename, meta, path) {
    try {
      let existingSha;
      let existingMeta = {};
      
      try {
        const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/metadata.json`, {
          headers: this.headers,
        });
        if (res.ok) {
          const data = await res.json();
          existingSha = data.sha;
          const decoded = atob(data.content.replace(/\n/g, ''));
          existingMeta = JSON.parse(decoded);
        }
      } catch {}

      existingMeta[filename] = { ...meta, path };
      
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(existingMeta, null, 2))));
      
      await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/metadata.json`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: 'Update metadata',
          content,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      });
    } catch (err) {
      console.warn('Metadata update failed:', err);
    }
  }

  // Buat folder files jika belum ada
  async initRepo() {
    try {
      // Buat README jika belum ada
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/README.md`, {
        headers: this.headers,
      });
      if (res.status === 404) {
        await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/README.md`, {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            message: 'Init FileShare Hub',
            content: btoa('# FileShare Hub\n\nRepository untuk berbagi file via FileShare Hub app.\n'),
          }),
        });
      }
    } catch (err) {
      console.warn('initRepo:', err);
    }
  }
}

// Deteksi tipe file untuk icon dan preview
export function getFileInfo(filename, mimeType) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/')) {
    return { category: 'image', color: '#10B981', label: 'Gambar' };
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    return { category: 'pdf', color: '#EF4444', label: 'PDF' };
  }
  if (['doc', 'docx'].includes(ext) || mime.includes('word')) {
    return { category: 'word', color: '#3B82F6', label: 'Word' };
  }
  if (['xls', 'xlsx'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet')) {
    return { category: 'excel', color: '#22C55E', label: 'Excel' };
  }
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) {
    return { category: 'powerpoint', color: '#F97316', label: 'PowerPoint' };
  }
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext) || mime.startsWith('video/')) {
    return { category: 'video', color: '#8B5CF6', label: 'Video' };
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext) || mime.startsWith('audio/')) {
    return { category: 'audio', color: '#EC4899', label: 'Audio' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { category: 'archive', color: '#F59E0B', label: 'Arsip' };
  }
  if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
    return { category: 'code', color: '#06B6D4', label: 'Kode' };
  }
  if (['txt', 'md', 'csv'].includes(ext) || mime.startsWith('text/')) {
    return { category: 'text', color: '#6B7280', label: 'Teks' };
  }
  return { category: 'other', color: '#9CA3AF', label: 'File' };
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Simpan konfigurasi di localStorage
export const config = {
  save: (token, owner, repo) => {
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_owner', owner);
    localStorage.setItem('gh_repo', repo);
  },
  load: () => ({
    token: localStorage.getItem('gh_token') || '',
    owner: localStorage.getItem('gh_owner') || '',
    repo: localStorage.getItem('gh_repo') || '',
  }),
  clear: () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_owner');
    localStorage.removeItem('gh_repo');
  },
};
