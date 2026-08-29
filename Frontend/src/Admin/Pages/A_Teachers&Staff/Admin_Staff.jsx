import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaCamera, FaUserEdit, FaTimes, FaGripVertical } from 'react-icons/fa';
import altpic from '../../../Images/download.png';
import Loading from "../../../Components/Loading/Loading";

const Admin_Staff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [draggedStaff, setDraggedStaff] = useState(null);
  const [dragOverStaff, setDragOverStaff] = useState(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const defaultMaleImage = 'https://static.vecteezy.com/system/resources/previews/003/715/527/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-vector.jpg';
  const defaultFemaleImage = 'https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-profile-picture-business-profile-woman-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-1325.jpg?semt=ais_hybrid';

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/staff?t=${new Date().getTime()}`);
      if (Array.isArray(response.data)) {
        setStaffMembers(response.data);
      } else {
        console.error('Unexpected staff data format:', response.data);
        setStaffMembers([]);
      }
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, staff) => {
    setDraggedStaff(staff);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, staff) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStaff(staff);
  };

  const handleDragLeave = () => {
    setDragOverStaff(null);
  };

  const handleDrop = async (e, targetStaff) => {
    e.preventDefault();
    if (!draggedStaff || draggedStaff.id === targetStaff.id) {
      setDraggedStaff(null);
      setDragOverStaff(null);
      return;
    }

    const draggedIndex = staffMembers.findIndex(s => s.id === draggedStaff.id);
    const targetIndex = staffMembers.findIndex(s => s.id === targetStaff.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedStaff(null);
      setDragOverStaff(null);
      return;
    }

    const newStaffMembers = [...staffMembers];
    const [draggedItem] = newStaffMembers.splice(draggedIndex, 1);
    newStaffMembers.splice(targetIndex, 0, draggedItem);

    setStaffMembers(newStaffMembers);
    setDraggedStaff(null);
    setDragOverStaff(null);

    // Save reordering to backend
    try {
      const orders = newStaffMembers.map((s, index) => ({ id: s.id, order_index: index }));
      await axios.put(`${API_BASE_URL}/staff-reorder`, { orders });
      toast.success('Staff reordered!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save order');
      fetchStaff(); // Revert to server state
    }
  };

  const handleDragEnd = () => {
    setDraggedStaff(null);
    setDragOverStaff(null);
  };

  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setName(staff.name);
    setPosition(staff.position);
    setIsEditModalOpen(true);
  };

  const handleImageClick = (staff) => {
    setSelectedStaff(staff);
    const currentImg = staff.image && staff.image !== ""
      ? (staff.image.startsWith('http') ? staff.image : `${API_BASE_URL}/${staff.image}?t=${new Date().getTime()}`)
      : getDefaultImage(staff.name);
    setImagePreview(currentImg);
    setIsImageModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDetails = async () => {
    try {
      if (!name || !position) {
        return toast.error('Please fill all required fields');
      }
      const updatedStaff = {
        name: name,
        position: position
      };
      await axios.put(`${API_BASE_URL}/staff/${selectedStaff.id}`, updatedStaff);
      fetchStaff();
      setIsEditModalOpen(false);
      toast.success('Details updated!');
    } catch (error) {
      console.error('Staff details update error:', error.response?.data || error);
      toast.error('Update failed');
    }
  };

  const handleImageUpdate = async () => {
    if (!imageFile) return toast.error("Select an image first");
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      await axios.put(`${API_BASE_URL}/staff/${selectedStaff.id}/image`, formData);
      fetchStaff();
      setIsImageModalOpen(false);
      setImageFile(null);
      toast.success('Photo updated!');
    } catch (error) {
      console.error('Staff photo update error:', error.response?.data || error);
      toast.error('Photo update failed');
    }
  };

  const handleAddStaff = async () => {
    if (!name || !position) return toast.error('Fill all fields');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('position', position);
    if (imageFile) formData.append('image', imageFile);

    try {
      await axios.post(`${API_BASE_URL}/staff`, formData);
      fetchStaff();
      setIsAddStaffModalOpen(false);
      resetForm();
      toast.success('New staff added!');
    } catch (error) {
      console.error('Add staff error:', error.response?.data || error);
      toast.error('Failed to add staff');
    }
  };

  const handleRemove = async (id) => {
    try {
      console.log('Attempting to delete staff ID:', id);
      const response = await axios.delete(`${API_BASE_URL}/staff/${id}`);
      console.log('Delete response:', response.data);
      fetchStaff();
      toast.success('Removed successfully');
    } catch (error) {
      console.error('Delete staff error:', error.response?.data || error.message);
      toast.error('Failed to remove');
    }
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Remove this staff?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { handleRemove(id); closeToast(); }}>Remove</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const resetForm = () => {
    setName('');
    setPosition('');
    setImageFile(null);
    setImagePreview(null);
    setSelectedStaff(null);
  };

  const getDefaultImage = (name) => {
    const maleSuffixes = ['Mr', 'Dr', 'Prof'];
    return maleSuffixes.some(s => name.startsWith(s)) ? defaultMaleImage : defaultFemaleImage;
  };

  const imageShape = { borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" };

  if (loading) return <Loading />;

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10 px-4 font-sans text-[18px]">

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Admin Staff</h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-indigo-700 font-bold text-sm">
            {staffMembers.length} Total Members
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDraggingEnabled(!isDraggingEnabled)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${isDraggingEnabled ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            title={isDraggingEnabled ? "Click to disable drag mode" : "Click to enable drag mode"}
          >
            <FaGripVertical /> {isDraggingEnabled ? 'Drag Mode ON' : 'Drag Mode OFF'}
          </button>
          <button
            onClick={() => { resetForm(); setIsAddStaffModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 font-bold text-sm uppercase tracking-widest"
          >
            <FaPlus /> Add New Staff
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {staffMembers.map((staff) => {
          const isHovered = hoveredId === staff.id;
          const isDragged = draggedStaff?.id === staff.id;
          const isDragOverThis = dragOverStaff?.id === staff.id;
          const staffImg = staff.image && staff.image !== ""
            ? (staff.image.startsWith('http') ? staff.image : `${API_BASE_URL}/${staff.image}?t=${new Date().getTime()}`)
            : getDefaultImage(staff.name);
          return (
            <div
              key={staff.id}
              draggable={isDraggingEnabled}
              onDragStart={(e) => isDraggingEnabled && handleDragStart(e, staff)}
              onDragOver={(e) => isDraggingEnabled && handleDragOver(e, staff)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => isDraggingEnabled && handleDrop(e, staff)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(staff.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative bg-white rounded-[2.5rem] p-8 text-center transition-all duration-300 border ${isDragged ? 'opacity-50 scale-95 border-amber-400 shadow-none' : isDragOverThis ? 'border-indigo-500 shadow-indigo-200 shadow-xl scale-102' : isHovered ? "border-indigo-400 shadow-2xl -translate-y-2" : "border-slate-100 shadow-md"}`}
            >
              {isDraggingEnabled && (
                <div className="absolute top-4 left-4 z-20 p-2 text-amber-500 cursor-grab active:cursor-grabbing">
                  <FaGripVertical size={18} />
                </div>
              )}

              <button
                onClick={() => confirmDelete(staff.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <FaTrash />
              </button>

              <div className="relative mx-auto mb-6 w-32 h-32 md:w-40 md:h-40 mt-4">
                <img
                  alt={staff.name}
                  src={staffImg}
                  style={{ ...imageShape, ...(isHovered ? { borderRadius: "50%" } : {}) }}
                  className="w-full h-full object-cover bg-slate-100 transition-all duration-500 shadow-inner"
                  onError={(e) => { e.currentTarget.src = altpic; }}
                />

                <button
                  onClick={() => handleImageClick(staff)}
                  className="absolute bottom-1 right-1 p-3 bg-indigo-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                >
                  <FaCamera size={14} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2 truncate px-2">{staff.name}</h3>
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 font-semibold text-sm mb-6">
                {staff.position}
              </span>

              <button
                onClick={() => handleEditClick(staff)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-600 hover:text-white transition-all duration-300"
              >
                <FaUserEdit /> Edit Profile
              </button>
            </div>
          );
        })}
      </div>

      {(isAddStaffModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">
                {isAddStaffModalOpen ? "Add New Staff" : "Edit Details"}
              </h3>
              <button onClick={() => { setIsAddStaffModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text" required className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Position <span className="text-red-500">*</span></label>
                <input
                  type="text" required className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black"
                  value={position} onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              {isAddStaffModalOpen && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Profile Image</label>
                  <input type="file" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={handleFileChange} />
                </div>
              )}
            </div>

            <button
              onClick={isAddStaffModalOpen ? handleAddStaff : handleSaveDetails}
              className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"
            >
              {isAddStaffModalOpen ? "Confirm Addition" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Update Profile Photo</h3>
            <div className="w-48 h-48 mx-auto mb-6">
              <img src={imagePreview} className="w-full h-full object-cover rounded-full border-4 border-indigo-50 shadow-lg" alt="Preview" />
            </div>
            <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handleFileChange} />
            <label htmlFor="photo-upload" className="block w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200 mb-3 transition-all">
              Choose New Photo
            </label>
            <div className="flex gap-3">
              <button onClick={() => setIsImageModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
              <button onClick={handleImageUpdate} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Staff;
