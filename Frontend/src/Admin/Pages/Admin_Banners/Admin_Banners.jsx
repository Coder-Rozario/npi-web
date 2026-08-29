import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from "../../../apiConfig";

const Admin_Banners = () => {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(5);
  const [active, setActive] = useState(true);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const bannerLimit = 2;
  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return Number(b.id) - Number(a.id);
    });
  }, [list]);
  const canUploadMore = list.length < bannerLimit;

  const navigate = useNavigate();
  const location = useLocation();

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners?nocache=${Date.now()}`);
      if (res.status === 401) {
        navigate('/Login', { state: { from: location.pathname } });
        return;
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    }
  }, [navigate, location.pathname]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const getBannerImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const normalized = imagePath.replace(/\\/g, '/').trim();
    if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:')) return normalized;
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canUploadMore) {
      toast.error(`Maximum of ${bannerLimit} banners allowed. Please remove one before adding another.`);
      return;
    }

    if (!file) {
      toast.error('Please choose an image to upload');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('durationSeconds', String(duration));
      fd.append('active', active ? '1' : '0');
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/banners`, { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (res.status === 401) {
        navigate('/Login', { state: { from: location.pathname } });
        return;
      }
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.message || errorBody?.error || 'Upload failed');
      }
      await fetchList();
      setFile(null);
      setDuration(5);
      setActive(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Banner saved successfully');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save banner. Please check the backend connection.');
    } finally { setLoading(false); }
  };

  const handleToggle = async (id, value) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ active: value }) });
    if (res.status === 401) { navigate('/Login', { state: { from: location.pathname } }); return; }
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      toast.error(errorBody?.message || errorBody?.error || 'Failed to update banner');
      return;
    }
    const updatedData = await res.json().catch(() => null);
    const updatedBanner = updatedData?.banner;
    if (updatedBanner && updatedBanner.id) {
      setList((prev) => prev.map((item) => String(item.id) === String(id) ? { ...item, ...updatedBanner } : { ...item, active: value }));
    } else {
      setList((prev) => prev.map((item) => String(item.id) === String(id) ? { ...item, active: value } : item));
    }
    toast.success(`Banner ${value ? 'activated' : 'deactivated'} successfully`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (res.status === 401) { navigate('/Login', { state: { from: location.pathname } }); return; }
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const msg = errorBody?.message || errorBody?.error || 'Failed to delete banner';
      toast.error(msg);
      if (res.status === 404) {
        setList((prev) => prev.filter((item) => String(item.id) !== String(id)));
      }
      return;
    }
    setList((prev) => prev.filter((item) => String(item.id) !== String(id)));
    toast.success('Banner deleted successfully');
  };

  const styles = {
    page: {
      padding: '24px',
      maxWidth: 1080,
      margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#1f2937'
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      marginBottom: 24,
      flexWrap: 'wrap'
    },
    title: {
      fontSize: 24,
      margin: 0,
      fontWeight: 700,
      color: '#0f172a'
    },
    subtitle: {
      margin: 0,
      color: '#475569',
      fontSize: 14
    },
    card: {
      background: '#ffffff',
      borderRadius: 18,
      border: '1px solid #e2e8f0',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
      padding: 24,
      marginBottom: 24
    },
    uploadCard: {
      borderRadius: 16,
      border: '2px dashed #cbd5e1',
      background: '#f8fafc',
      padding: '18px',
      transition: 'border-color 0.2s ease, background 0.2s ease',
      cursor: 'pointer'
    },
    uploadNote: {
      color: '#64748b',
      fontSize: 13,
      marginTop: 8,
      lineHeight: 1.5
    },
    fileName: {
      color: '#0f172a',
      fontSize: 13,
      marginTop: 8,
      fontWeight: 600
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 18
    },
    formRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    },
    label: {
      fontSize: 14,
      fontWeight: 600,
      color: '#334155'
    },
    input: {
      width: '100%',
      borderRadius: 12,
      border: '1px solid #cbd5e1',
      padding: '12px 14px',
      fontSize: 14,
      background: '#f8fafc',
      color: '#0f172a',
      outline: 'none'
    },
    fileRow: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 4
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 999,
      background: '#f8fafc',
      color: '#334155',
      fontSize: 13
    },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12
    },
    buttonPrimary: {
      border: 'none',
      borderRadius: 999,
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '12px 24px',
      fontSize: 14,
      cursor: 'pointer',
      transition: 'transform 0.2s ease, background 0.2s ease'
    },
    buttonSecondary: {
      border: '1px solid #cbd5e1',
      borderRadius: 999,
      background: '#ffffff',
      color: '#0f172a',
      padding: '12px 24px',
      fontSize: 14,
      cursor: 'pointer'
    },
    listGrid: {
      display: 'grid',
      gap: 18
    },
    bannerCard: {
      display: 'grid',
      gridTemplateColumns: '140px minmax(0, 1fr) auto',
      gap: 18,
      alignItems: 'center',
      padding: 18,
      borderRadius: 16,
      border: '1px solid #e2e8f0',
      background: '#f8fafc'
    },
    bannerPreview: {
      width: 140,
      height: 90,
      borderRadius: 14,
      overflow: 'hidden',
      background: '#eef2ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    infoRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    },
    infoText: {
      margin: 0,
      color: '#475569',
      fontSize: 14
    },
    infoStrong: {
      fontWeight: 600,
      color: '#0f172a'
    },
    listEmpty: {
      padding: 24,
      borderRadius: 16,
      border: '1px dashed #cbd5e1',
      background: '#ffffff',
      textAlign: 'center',
      color: '#64748b'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>Banner Manager</h2>
          <p style={styles.subtitle}>Upload banners for the homepage. Only active banners will show in the live site.</p>
        </div>
        <div style={styles.badge}>Admin Interface</div>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.formRow}>
            <label htmlFor="banner-image" style={styles.label}>Banner image</label>
            <label htmlFor="banner-image" style={{ ...styles.uploadCard, width: '100%' }}>
              <input ref={fileInputRef} id="banner-image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} disabled={!canUploadMore || loading} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ ...styles.buttonSecondary, padding: '10px 18px', borderRadius: 999, cursor: 'pointer' }}>Choose file</span>
                <span style={styles.fileName}>{file ? file.name : 'No file selected yet'}</span>
              </div>
              <p style={styles.uploadNote}>Select a high-resolution banner image. Uploaded images are stored under the backend uploads folder.</p>
              {!canUploadMore && (
                <p style={{ ...styles.uploadNote, marginTop: 8, color: '#b91c1c' }}>
                  Maximum of {bannerLimit} banners reached. Delete one before adding a new banner.
                </p>
              )}
            </label>
          </div>

          <div style={styles.formRow}>
            <label htmlFor="duration" style={styles.label}>Duration (seconds)</label>
            <input id="duration" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={styles.input} />
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Visibility</label>
            <div style={styles.checkboxRow}>
              <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <label htmlFor="active" style={{ fontSize: 14, color: '#334155' }}>Publish banner now</label>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading || !canUploadMore} style={styles.buttonPrimary}>{loading ? 'Saving...' : 'Save Banner'}</button>
            <button type="button" onClick={() => { setFile(null); setDuration(5); setActive(true); }} style={styles.buttonSecondary}>Reset form</button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Existing Banners</h3>
            <p style={{ margin: '6px 0 0', color: '#475569', fontSize: 14 }}>Manage banner visibility and remove outdated items.</p>
          </div>
          <span style={{ ...styles.badge, background: '#e2e8f0', color: '#0f172a' }}>{list.length} item{list.length === 1 ? '' : 's'}</span>
        </div>

        {sortedList.length === 0 ? (
          <div style={styles.listEmpty}>No banners available yet. Upload a banner to start showing it on the site.</div>
        ) : (
          <div style={styles.listGrid}>
            {sortedList.map(b => (
              <div key={b.id} style={styles.bannerCard}>
                <div style={styles.bannerPreview}>
                  {b.image ? <img src={getBannerImageUrl(b.image)} alt="banner" style={styles.bannerImage} /> : <span style={{ color: '#64748b', fontSize: 13 }}>No image</span>}
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoText}><span style={styles.infoStrong}>Banner ID:</span> {b.id}</p>
                  <p style={styles.infoText}><span style={styles.infoStrong}>Duration:</span> {b.durationSeconds}s</p>
                  <p style={styles.infoText}><span style={styles.infoStrong}>Status:</span> {b.active ? 'Active' : 'Inactive'}</p>
                </div>
                <div style={styles.actions}>
                  <button type="button" onClick={() => handleToggle(b.id, !b.active)} style={styles.buttonSecondary}>{b.active ? 'Deactivate' : 'Activate'}</button>
                  <button type="button" onClick={() => handleDelete(b.id)} style={{ ...styles.buttonSecondary, borderColor: '#f87171', color: '#b91c1c' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin_Banners;
