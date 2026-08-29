import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlay, HiX, HiPlus, HiTrash, HiPencilAlt } from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin_video = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoVersion, setVideoVersion] = useState(Date.now());

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos?t=${new Date().getTime()}`);
      if (Array.isArray(response.data)) {
        setVideos(response.data);
        setVideoVersion(Date.now());
      } else {
        console.error('Unexpected videos data format:', response.data);
        setVideos([]);
      }
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsEditing(false);
      setShowModal(true);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!selectedFile || !videoTitle) return toast.error('Please provide a title and video');

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', videoTitle);

    try {
      const token = localStorage.getItem('authToken');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };
      await axios.post(`${API_BASE_URL}/videos`, formData, config);
      await fetchVideos();
      setVideoVersion(Date.now());
      setShowModal(false);
      resetForm();
      toast.success('Video added successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (video) => {
    setIsEditing(true);
    setEditingVideoId(video.id);
    setVideoTitle(video.title);
    setShowModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.put(`${API_BASE_URL}/videos/${editingVideoId}`, { title: videoTitle }, config);
      setVideos(videos.map(v => v.id === editingVideoId ? { ...v, title: response.data.title } : v));
      setShowModal(false);
      resetForm();
      toast.success('Title updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      await axios.delete(`${API_BASE_URL}/videos/${id}`, config);
      setVideos(videos.filter(v => v.id !== id));
      toast.success('Deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this video?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { handleDelete(id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const resetForm = () => {
    setVideoTitle('');
    setSelectedFile(null);
    setIsEditing(false);
    setEditingVideoId(null);
  };

  const getFullVideoUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const normalized = path.replace(/\\/g, '/');
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/uploads/${cleanPath}?t=${videoVersion}`;
  };

  return (
    <div className="bg-[#f8fafc] py-12 px-4 relative">
      
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Activities Management</h1>
            <div className="w-20 h-1.5 bg-blue-600 rounded-full mx-auto md:mx-0"></div>
          </div>
          
          <button 
            onClick={() => document.getElementById('video-input').click()}
            className="group flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1"
          >
            <HiPlus size={24} /> Add New Video
          </button>
          <input id="video-input" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 font-bold text-blue-600">Loading Activities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col"
              >
                
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <video
                    src={getFullVideoUrl(video.video_url)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                    muted
                    loop
                  />
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(video)} className="p-3 bg-white/90 backdrop-blur text-blue-600 rounded-full hover:bg-white shadow-md transition-transform hover:scale-110">
                      <HiPencilAlt size={20} />
                    </button>
                    <button onClick={() => confirmDelete(video.id)} className="p-3 bg-white/90 backdrop-blur text-red-600 rounded-full hover:bg-white shadow-md transition-transform hover:scale-110">
                      <HiTrash size={20} />
                    </button>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                    <div className="p-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                      <HiOutlinePlay className="text-white text-3xl" />
                    </div>
                  </div>
                </div>

                
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2">{video.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-md italic">
                      Admin Activity
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Title' : 'New Video'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><HiX size={28} /></button>
              </div>

              <form onSubmit={isEditing ? handleSaveEdit : handleUploadVideo} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Video Title</label>
                  <input
                    type="text"
                    required
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="E.g. Football Tournament 2026"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                {!isEditing && selectedFile && (
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg"><HiOutlinePlay size={20} /></div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-blue-900 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-blue-600 uppercase font-black">Ready to upload</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      isEditing ? 'Save Changes' : 'Confirm Upload'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin_video;
