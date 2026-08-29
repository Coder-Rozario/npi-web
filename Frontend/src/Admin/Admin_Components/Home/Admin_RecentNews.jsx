import { useState, useEffect } from 'react';
import { API_BASE_URL, placeholderImage } from "../../../apiConfig";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin_RecentNews = () => {
  const [news, setNews] = useState([]);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newContent, setNewContent] = useState('');

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/news?t=${new Date().getTime()}`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news.');
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/news/${id}`);
      setNews(prevNews => prevNews.filter((item) => item.id !== id && item._id !== id));
      setRefreshKey(Date.now());
      toast.success('Event deleted successfully!');
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this event?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { handleDelete(id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setNewTitle(item.title);
    setNewImage(null);
    setNewContent(item.details || '');
    setIsModalOpen(true);
  };

  const handleAddNews = () => {
    setEditingNews(null);
    setNewTitle('');
    setNewImage(null);
    setNewContent('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newImage && !editingNews) {
      toast.error('Please upload an image for new events.');
      return;
    }

    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('details', newContent);
    if (newImage) formData.append('image', newImage);

    try {
      const token = localStorage.getItem('authToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (editingNews) {
        await axios.put(`${API_BASE_URL}/news/${editingNews.id}`, formData, config);
        await fetchNews();
        setRefreshKey(Date.now());
        toast.success('Updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/news`, formData, config);
        await fetchNews();
        setRefreshKey(Date.now());
        toast.success('Added successfully!');
      }
      handleModalClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error saving event.');
    }
  };

  const getNewsImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage('400x250');
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}?t=${refreshKey}`;
  };


  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      backgroundColor: '#f4f7f6',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      marginBottom: '30px'
    },
    addBtn: {
      padding: '12px 24px',
      backgroundColor: '#0186C0',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: '0.3s'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      position: 'relative'
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      backgroundColor: '#ffffff',
      padding: '40px',
      borderRadius: '24px',
      width: '90%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
      position: 'relative'
    },
    inputLabel: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#4b5563'
    },
    whiteInput: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      borderRadius: '12px',
      border: '1px solid #d1d5db',
      backgroundColor: '#ffffff',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      color: '#1f2937'
    },
    fileInputWrapper: {
      position: 'relative',
      width: '100%',
      height: '100px',
      border: '2px dashed #cbd5e1',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      marginBottom: '20px',
      transition: '0.3s'
    },
    submitBtn: {
      backgroundColor: '#0369A1',
      color: 'white',
      padding: '14px',
      borderRadius: '12px',
      border: 'none',
      width: '100%',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      
      <header style={styles.header}>
        <h2 style={{fontSize: '24px', color: '#111827'}}>Manage Events</h2>
        <button style={styles.addBtn} onClick={handleAddNews}>+ Create New</button>
      </header>

      <div style={styles.grid}>
        {Array.isArray(news) && news.map((item) => (
          <div key={item.id || item._id} style={styles.card}>
            <img src={getNewsImageUrl(item.image)} alt={item.title} style={{width:'100%', height:'180px', objectFit:'cover'}} />
            <div style={{padding: '15px'}}>
              <p style={{fontWeight:'600', marginBottom:'40px'}}>{item.title}</p>
              <div style={{display:'flex', gap:'8px', position:'absolute', bottom:'15px', left:'15px', right:'15px'}}>
                <button onClick={() => handleEdit(item)} style={{flex:1, padding:'7px', borderRadius:'6px', border:'1px solid #ddd', cursor:'pointer'}}>Edit</button>
                <button onClick={() => confirmDelete(item.id)} style={{flex:1, padding:'7px', borderRadius:'6px', border:'none', backgroundColor:'#fee2e2', color:'#ef4444', cursor:'pointer'}}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button 
                onClick={handleModalClose}
                style={{position:'absolute', top:'20px', right:'20px', background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#9ca3af'}}
            >
                &times;
            </button>
            
            <h3 style={{fontSize: '22px', marginBottom: '25px', color: '#111827', textAlign:'center'}}>
              {editingNews ? 'Edit News Event' : 'Add News Event'}
            </h3>

            <form onSubmit={handleFormSubmit} encType="multipart/form-data">
              <label style={styles.inputLabel}>Event Title</label>
              <input
                style={styles.whiteInput}
                type="text"
                placeholder="e.g. Annual Sports Day 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              <label style={styles.inputLabel}>Featured Image</label>
              <div 
                style={styles.fileInputWrapper}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#0369A1'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <span style={{fontSize: '24px'}}>📁</span>
                <span style={{fontSize: '14px', color: '#64748b', marginTop: '5px'}}>
                  {newImage ? newImage.name : "Click to upload or drag & drop"}
                </span>
                <input
                  type="file"
                  onChange={(e) => setNewImage(e.target.files[0])}
                  required={!editingNews}
                  style={{position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer'}}
                />
              </div>

              <label style={styles.inputLabel}>Content Details</label>
              <textarea
                style={{...styles.whiteInput, minHeight: '30vh', resize: 'none'}}
                placeholder="Write event description or HTML content..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              ></textarea>

              <button type="submit" style={styles.submitBtn}>
                {editingNews ? 'Update Post' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        input:focus, textarea:focus { border-color: #0369A1 !important; box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.1); }
        @media (max-width: 640px) { .modal-content { padding: 25px !important; } }
      `}</style>
    </div>
  );
};

export default Admin_RecentNews;
