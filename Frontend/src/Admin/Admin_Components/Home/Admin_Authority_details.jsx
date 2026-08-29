import { API_BASE_URL, authFetch, placeholderImage } from "../../../apiConfig";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '../../../Components/Loading/Loading';
import { FaCamera, FaSave, FaArrowLeft, FaEdit } from 'react-icons/fa';
import { MdVerified, MdLayers } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';

const Admin_Authority_details = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [photo, setPhoto] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage(200);
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/authority/${id}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch teacher details');
        const data = await response.json();
        if (data) {
          setTeacher(data);
          setBio(data.bio || '');
          setName(data.name || '');
          setPosition(data.position || '');
          setPhoto(getFullImageUrl(data.image));
        }
      } catch (error) {
        console.error('Error fetching teacher details:', error);
        toast.error('Error fetching teacher details');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  const openModal = (field) => {
    setEditingField(field);
    setNewValue(field === 'name' ? name : position);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleUpdate = async () => {
    const updatedTeacher = { ...teacher, bio };
    if (editingField === 'name') {
      updatedTeacher.name = newValue;
      setName(newValue);
    } else if (editingField === 'position') {
      updatedTeacher.position = newValue;
      setPosition(newValue);
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/authority/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeacher),
      });

      if (response.ok) {
        toast.success('Information updated successfully!');
        setTeacher(updatedTeacher);
      } else {
        throw new Error('Failed to update data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      toast.error('Error updating data');
    }
    closeModal();
  };

  const handleSaveBio = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/authority/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, position, bio, image: teacher.image }),
      });

      if (response.ok) {
        toast.success('Biography saved successfully!');
      } else {
        throw new Error('Failed to save bio');
      }
    } catch (error) {
      console.error('Error saving bio:', error);
      toast.error('Error saving bio');
    }
  };

  const handlePhotoChange = async (e) => {
    const formData = new FormData();
    const file = e.target.files[0];
    if (!file) return;
    formData.append('photo', file);

    try {
      const response = await authFetch(`${API_BASE_URL}/authority/${id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Photo updated successfully!');
        const fullUrl = getFullImageUrl(data.image);
        setPhoto(fullUrl);
        setTeacher((prev) => ({ ...prev, image: data.image }));
      } else {
        throw new Error('Failed to update photo');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Error updating photo');
    }
  };

  if (loading) return <Loading />;

  const styles = {
    container: {
      maxWidth: isMobile ? '100%' : '75vw',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      border: '1px solid #f1f5f9',
    },
    headerGradient: {
      height: isMobile ? '120px' : '180px',
      background: 'linear-gradient(135deg, #082F49 0%, #0186C0 100%)',
    },
    imageWrapper: {
      marginTop: isMobile ? '-60px' : '-90px',
      display: 'flex',
      justifyContent: 'center',
    },
    profileImg: {
      width: isMobile ? '140px' : '200px',
      height: isMobile ? '140px' : '200px',
      objectFit: 'cover',
      borderRadius: '50%',
      border: '6px solid #ffffff',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      cursor: 'pointer'
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-12 px-4">
      
      <div style={styles.container}>
        
        <div style={styles.headerGradient} className="relative">
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-6 left-6 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white p-3 rounded-xl transition-all"
          >
            <FaArrowLeft />
          </button>
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-blue-500/30 backdrop-blur-md border border-blue-400/30 text-blue-100 px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest">
            <MdVerified className="text-blue-300" /> Admin Editing Mode
          </div>
        </div>

        
        <div style={styles.imageWrapper}>
          <div className="relative group">
            <img
              src={photo || placeholderImage(200)}
              alt={name}
              style={styles.profileImg}
              onClick={() => document.getElementById('photoInput').click()}
              className="group-hover:scale-105 transition-transform duration-500"
            />
            <div 
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => document.getElementById('photoInput').click()}
            >
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 text-white">
                <FaCamera size={24} />
              </div>
            </div>
            <input id="photoInput" type="file" className="hidden" onChange={handlePhotoChange} />
            <div className={`absolute ${isMobile ? 'bottom-1 right-2 w-4 h-4' : 'bottom-4 right-4 w-7 h-7'} bg-green-500 border-4 border-white rounded-full shadow-lg`}></div>
          </div>
        </div>

        
        <div className="text-center px-6 pt-8 pb-4">
          <div className="inline-flex items-center gap-3 cursor-pointer group" onClick={() => openModal('name')}>
            <h2 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-black text-slate-900 tracking-tight`}>
              {name}
            </h2>
            <FaEdit className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
          </div>
          
          <div className="mt-3">
            <div className="inline-flex items-center gap-2 cursor-pointer group" onClick={() => openModal('position')}>
              <p className={`text-blue-600 font-bold ${isMobile ? 'text-base' : 'text-xl'} uppercase tracking-[0.2em]`}>
                {position}
              </p>
              <FaEdit className="text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
            </div>
          </div>
          <div className="w-20 h-2 bg-blue-600 mx-auto mt-8 rounded-full shadow-lg shadow-blue-200"></div>
        </div>

        
        <div className="px-6 md:px-12 lg:px-24 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-slate-200"></span>
              <h4 className="text-slate-400 uppercase text-xs font-black tracking-[0.3em]">Edit Biography</h4>
              <span className="h-px w-12 bg-slate-200"></span>
            </div>
            <button 
              onClick={handleSaveBio} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
            >
              <FaSave /> Save Biography
            </button>
          </div>
          
          <div className="admin-bio-editor bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
            <div className="mb-6">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 block ml-1">
                HTML Content Editor
              </label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                className="w-full min-h-[400px] bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-blue-600 focus:bg-white outline-none transition-all font-mono text-sm text-slate-700 leading-relaxed"
                placeholder="Write biography here (HTML supported)..."
              />
            </div>

            <div className="border-t-2 border-slate-50 pt-6">
              <label className="text-[10px] uppercase tracking-widest font-black text-blue-400 mb-4 block ml-1">
                Live Preview
              </label>
              <div 
                className="preview-content prose prose-slate max-w-none bg-blue-50/30 rounded-2xl p-8 border border-blue-100/50 min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bio || "") }}
              />
            </div>
          </div>
        </div>

        
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white/50 text-xs font-bold uppercase tracking-widest">
          <span>Authority Management System</span>
          <span className="flex items-center gap-2">
            <MdLayers className="text-blue-400" /> NPI DHAKA
          </span>
        </div>
      </div>

      
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={closeModal} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FaEdit size={18} /></div>
                Edit {editingField === 'name' ? 'Full Name' : 'Position'}
              </h3>
              
              <div className="space-y-2 mb-8">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">
                  New {editingField}
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleUpdate} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30"
                >
                  Save Changes
                </button>
                <button 
                  onClick={closeModal} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .preview-content {
          line-height: 1.8;
          color: #334155;
          font-size: 1.05rem;
        }
        .preview-content p {
          margin-bottom: 1.5rem;
        }
        .preview-content strong {
          color: #1e293b;
          font-weight: 700;
        }
        .preview-content ul, .preview-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .preview-content li {
          margin-bottom: 0.5rem;
        }
        textarea::-webkit-scrollbar {
          width: 8px;
        }
        textarea::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Admin_Authority_details;
