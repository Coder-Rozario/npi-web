import { API_BASE_URL, BASE_URL } from "../../../apiConfig";
import { useEffect, useState } from "react";
import { AiOutlineClose, AiOutlinePlus, AiOutlineEdit, AiOutlineExpandAlt } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin_Images = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", imgSrc: null });
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/portfolio?t=${new Date().getTime()}`)
      .then(response => {
        const data = Array.isArray(response.data) ? [...response.data].reverse() : [];
        setItems(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching:', error);
        setLoading(false);
      });
  };


  const handleOpenEdit = (item) => {
    setCurrentItem(item);
    setFormData({ title: item.title, description: item.description, imgSrc: item.imgSrc });
    const currentPreview = item.imgSrc && !item.imgSrc.startsWith('http') 
      ? `${BASE_URL}/${item.imgSrc}?t=${new Date().getTime()}` 
      : item.imgSrc;
    setPreviewImg(currentPreview);
    setEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({ title: "", description: "", imgSrc: null });
    setPreviewImg(null);
    setAddModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imgSrc: file });
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  const confirmDeleteToast = (item) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this achievement item?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { confirmDelete(item.id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const confirmDelete = (id) => {
     axios.delete(`${API_BASE_URL}/portfolio/${id}`)
       .then(() => {
         fetchItems();
         toast.success('Deleted successfully!');
       })
       .catch(() => toast.error('Delete failed!'));
   };


   const handlePostOrUpdate = async (type) => {
     const data = new FormData();
     data.append('title', formData.title);
     data.append('description', formData.description);
     data.append('zoomTitle', formData.title);
     if (formData.imgSrc instanceof File) {
       data.append('image', formData.imgSrc);
     }

     try {
       if (type === 'add') {
         await axios.post(`${API_BASE_URL}/portfolio`, data);
         toast.success("Added successfully!");
       } else {
         await axios.put(`${API_BASE_URL}/portfolio/${currentItem.id}`, data);
         toast.success("Updated successfully!");
       }
       fetchItems();
       setAddModalOpen(false);
       setEditModalOpen(false);
     } catch (error) {
       toast.error("Operation failed!");
     }
   };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center md:text-left">Achievement <span className="text-blue-600">Management</span></h2>
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 font-bold active:scale-95"
          >
            <AiOutlinePlus size={20} /> Add New Item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-blue-600 font-bold">Loading Achievements...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {items.map((item, index) => {
                  const itemImg = item.imgSrc && !item.imgSrc.startsWith('http') 
                    ? `${BASE_URL}/${item.imgSrc}?t=${new Date().getTime()}` 
                    : item.imgSrc;
                  return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white rounded-[2rem] p-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(3,105,161,0.2)] transition-all cursor-default"
                >
                  <div className="relative overflow-hidden rounded-[1.5rem] h-64 shadow-inner">
                    <img alt={item.title} src={itemImg} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
                  
                  
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button onClick={() => handleOpenEdit(item)} className="p-3 bg-white text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all transform scale-90 group-hover:scale-100">
                      <AiOutlineEdit size={24} />
                    </button>
                    <button onClick={() => confirmDeleteToast(item)} className="p-3 bg-white text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all transform scale-90 group-hover:scale-100">
                      <AiOutlineClose size={24} />
                    </button>
                  </div>
                </div>

                <div className="pt-6 pb-4 px-4 text-center">
                  <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-1 italic">{item.description}</p>
                </div>
              </motion.div>
            );
            })}
          </div>
        )}
      </div>

      
      <AnimatePresence>
        {(addModalOpen || editModalOpen) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold mb-6 text-slate-800">{addModalOpen ? 'Add Portfolio' : 'Edit Portfolio'}</h2>
              
              <div className="space-y-4">
                <input
                  type="text" placeholder="Title"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-black"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                <textarea
                  placeholder="Description" rows="3"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-black"
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
                
                <div className="relative group">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <div className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500 group-hover:border-blue-400 transition-colors">
                    {previewImg ? 'Change Image' : 'Select Image'}
                  </div>
                </div>

                {previewImg && (
                  <div className="relative h-40 rounded-2xl overflow-hidden mt-4">
                    <img src={previewImg} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => {setAddModalOpen(false); setEditModalOpen(false)}} className="flex-1 p-4 text-slate-500 font-bold">Cancel</button>
                <button 
                  onClick={() => handlePostOrUpdate(addModalOpen ? 'add' : 'edit')}
                  className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200"
                >
                  {addModalOpen ? 'Post Item' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Admin_Images;
