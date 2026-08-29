import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, placeholderImage } from "../../../apiConfig";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Admin_Authority = () => {
   const navigate = useNavigate();
   
   const [teachers, setTeachers] = useState(() => {
      try {
         const cached = sessionStorage.getItem('admin_authority_list');
         return cached ? JSON.parse(cached) : [];
      } catch (_) {
         return [];
      }
   });

   const [error, setError] = useState(null);
   const [loading, setLoading] = useState(teachers.length === 0);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [newAuthority, setNewAuthority] = useState({ name: '', position: '', image: null });

   const fetchAuthority = async () => {
      try {
         const response = await fetch(`${API_BASE_URL}/authority?t=${Date.now()}`, { cache: 'no-store' });
         if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
         }
         const data = await response.json();
         const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
         setTeachers(list);
         sessionStorage.setItem('admin_authority_list', JSON.stringify(list));
         setError(null);
      } catch (err) {
         console.error('Error fetching data:', err);
         setError('Unable to load authority list.');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchAuthority();
   }, []);

   const handleMove = async (id, direction, e) => {
      e.stopPropagation();
      const index = teachers.findIndex(t => t.id === id);
      if (index === -1) return;

      const newTeachers = [...teachers];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newTeachers.length) return;

      const [moved] = newTeachers.splice(index, 1);
      newTeachers.splice(targetIndex, 0, moved);

      const orders = newTeachers.map((t, idx) => ({ id: t.id, order_index: idx }));

      try {
         await axios.put(`${API_BASE_URL}/authority-reorder`, { orders });
         setTeachers(newTeachers);
         toast.success("Order updated!");
      } catch (err) {
         toast.error("Failed to reorder");
      }
   };

   const handleDelete = async (id, e) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this authority member?")) {
         try {
            await axios.delete(`${API_BASE_URL}/authority/${id}`);
            toast.success("Deleted successfully!");
            fetchAuthority();
         } catch (err) {
            toast.error("Failed to delete");
         }
      }
   };

   const handleAddAuthority = async () => {
      if (!newAuthority.name || !newAuthority.position) {
         toast.error("Name and position are required");
         return;
      }

      const formData = new FormData();
      formData.append('name', newAuthority.name);
      formData.append('position', newAuthority.position);
      if (newAuthority.image) {
         formData.append('image', newAuthority.image);
      }

      try {
         await axios.post(`${API_BASE_URL}/authority`, formData);
         toast.success("Added successfully!");
         setIsAddModalOpen(false);
         setNewAuthority({ name: '', position: '', image: null });
         fetchAuthority();
      } catch (err) {
         toast.error("Failed to add");
      }
   };

   const handleCardClick = (id) => {
      navigate(`/Admin/Admin_Authority/${id}`);
   };

   const getFullImageUrl = (imagePath) => {
      if (!imagePath) return placeholderImage(150);
      if (imagePath.startsWith('http')) return imagePath;
      return `${API_BASE_URL}/${imagePath}`;
   };

   return (
      <div className="Header relative min-h-[400px]" style={{ background: '#f8fafc', padding: '60px 0' }}>
         
         <div className="text-center mb-10 md:mb-16">
            <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 mb-4">
               Administration <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Corner (Admin)</span>
            </h1>
            <div className="w-20 md:w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
         </div>

         <div className="container mx-auto">
            <div className="admin_cell flex flex-wrap justify-center gap-10 md:gap-16 p-5">
               {loading && teachers.length === 0 && (
                  <div className="text-slate-500 font-medium">Loading Authority Data...</div>
               )}
               
               {!loading && error && (
                  <div className="text-red-500 font-medium">{error}</div>
               )}
               
               {teachers.map((teacher, index) => (
                  <div key={teacher.id} className="flex justify-center relative group">
                     <div 
                        className="premium-card" 
                        onClick={() => handleCardClick(teacher.id)}
                     >
                        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={(e) => handleMove(teacher.id, 'up', e)}
                              className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all"
                              disabled={index === 0}
                              title="Move Left"
                           >
                              ←
                           </button>
                           <button 
                              onClick={(e) => handleMove(teacher.id, 'down', e)}
                              className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all"
                              disabled={index === teachers.length - 1}
                              title="Move Right"
                           >
                              →
                           </button>
                           <button 
                              onClick={(e) => handleDelete(teacher.id, e)}
                              className="p-2 bg-red-500/90 backdrop-blur text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                           >
                              ×
                           </button>
                        </div>
                        <div className="image-container">
                           <img 
                              alt={teacher.name} 
                              src={getFullImageUrl(teacher?.image)} 
                           />
                        </div>
                        <div className="content-overlay">
                           <h3>{teacher.name}</h3>
                           <p className="position">{teacher.position}</p>
                           <button className="read-more-btn">
                              Edit Info
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M5 12h14M12 5l7 7-7 7"/>
                              </svg>
                           </button>
                        </div>
                     </div>
                  </div>
               ))}

               <div className="flex justify-center">
                  <div 
                     className="premium-card flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                     onClick={() => setIsAddModalOpen(true)}
                  >
                     <div className="text-6xl text-slate-300 font-light">+</div>
                     <div className="mt-4 text-slate-500 font-semibold">Add New Authority</div>
                  </div>
               </div>
            </div>
         </div>

         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                     <h2 className="text-lg text-white font-bold">Add New Authority</h2>
                     <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white text-2xl">×</button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                        <input 
                           type="text" 
                           className="w-full bg-white border border-blue-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
                           value={newAuthority.name}
                           onChange={(e) => setNewAuthority(prev => ({...prev, name: e.target.value}))}
                           placeholder="Enter name"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Position</label>
                        <input 
                           type="text" 
                           className="w-full bg-white border border-blue-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
                           value={newAuthority.position}
                           onChange={(e) => setNewAuthority(prev => ({...prev, position: e.target.value}))}
                           placeholder="e.g. Chairman"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Photo</label>
                        <input 
                           type="file" 
                           className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                           onChange={(e) => setNewAuthority(prev => ({...prev, image: e.target.files[0]}))}
                        />
                     </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 flex justify-end">
                     <button 
                        onClick={handleAddAuthority}
                        className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                     >
                        Add Member
                     </button>
                  </div>
               </div>
            </div>
         )}

         <style>{`
            .premium-card {
               position: relative;
               background: #ffffff;
               border-radius: 20px;
               overflow: hidden;
               box-shadow: 0 10px 30px rgba(0,0,0,0.05);
               transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
               cursor: pointer;
               width: 280px;
               height: 360px;
               border: 1px solid rgba(0,0,0,0.05);
            }

            @media (min-width: 768px) {
               .premium-card {
                  width: 320px;
                  height: 400px;
               }
            }

            .premium-card:hover {
               transform: translateY(-10px);
               box-shadow: 0 20px 40px rgba(0,0,0,0.12);
            }

            .image-container {
               width: 100%;
               height: 100%;
               overflow: hidden;
            }

            .image-container img {
               width: 100%;
               height: 100%;
               object-fit: cover;
               transition: transform 0.6s ease;
            }

            .premium-card:hover .image-container img {
               transform: scale(1.1);
            }

            .content-overlay {
               position: absolute;
               bottom: 0;
               left: 0;
               right: 0;
               padding: 20px;
               background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
               color: white;
               transition: all 0.4s ease;
               display: flex;
               flex-direction: column;
               justify-content: flex-end;
               height: 45%;
            }

            .premium-card:hover .content-overlay {
               background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 100%);
               height: 60%;
               justify-content: center;
               align-items: center;
               text-align: center;
            }

            .content-overlay h3 {
               margin: 0;
               font-size: 1.25rem;
               font-weight: 700;
               line-height: 1.2;
            }

            .position {
               margin: 6px 0 12px 0;
               font-size: 0.9rem;
               color: #cbd5e1;
               font-weight: 400;
            }

            .read-more-btn {
               opacity: 0;
               transform: translateY(15px);
               transition: all 0.4s ease;
               background: #0186C0;
               color: white;
               border: none;
               padding: 10px 20px;
               border-radius: 50px;
               font-weight: 600;
               font-size: 0.85rem;
               display: flex;
               align-items: center;
               gap: 8px;
            }

            .premium-card:hover .read-more-btn {
               opacity: 1;
               transform: translateY(0);
            }

            .read-more-btn:hover {
               background: #075985;
               transform: scale(1.05);
            }
         `}</style>
      </div>
   );
};

export default Admin_Authority;
