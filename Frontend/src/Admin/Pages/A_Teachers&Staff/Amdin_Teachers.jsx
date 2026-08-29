import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaCamera, FaUserEdit, FaTimes, FaEnvelope, FaGraduationCap, FaGripVertical } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import altpic from '../../../images/download.png';

const Admin_Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [draggedTeacher, setDraggedTeacher] = useState(null);
  const [dragOverTeacher, setDragOverTeacher] = useState(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);

  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [qualification, setQualification] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const departments = [
    "Architecture Technology",
    "Automobile Technology",
    "Civil Technology",
    "Computer Technology",
    "Electrical Technology",
    "Electronics Technology",
    "Mechanical Technology",
    "Food Technology",
    "Textile Technology",
    "R.S "
  ];

  const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers?t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        setTeachers(response.data);
        setRefreshKey(Date.now());
      } else {
        console.error('Unexpected teachers data format:', response.data);
        setTeachers([]);
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, teacher) => {
    setDraggedTeacher(teacher);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, teacher) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTeacher(teacher);
  };

  const handleDragLeave = () => {
    setDragOverTeacher(null);
  };

  const handleDrop = async (e, targetTeacher) => {
    e.preventDefault();
    if (!draggedTeacher || draggedTeacher.id === targetTeacher.id) {
      setDraggedTeacher(null);
      setDragOverTeacher(null);
      return;
    }

    const draggedIndex = teachers.findIndex(t => t.id === draggedTeacher.id);
    const targetIndex = teachers.findIndex(t => t.id === targetTeacher.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTeacher(null);
      setDragOverTeacher(null);
      return;
    }

    const newTeachers = [...teachers];
    const [draggedItem] = newTeachers.splice(draggedIndex, 1);
    newTeachers.splice(targetIndex, 0, draggedItem);

    setTeachers(newTeachers);
    setDraggedTeacher(null);
    setDragOverTeacher(null);

    // Save reordering to backend
    try {
      const orders = newTeachers.map((t, index) => ({ id: t.id, order_index: index }));
      await axios.put(`${API_BASE_URL}/teachers-reorder`, { orders });
      toast.success('Teachers reordered!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save order');
      fetchTeachers(); // Revert to server state
    }
  };

  const handleDragEnd = () => {
    setDraggedTeacher(null);
    setDragOverTeacher(null);
  };

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher);
    setName(teacher.name);
    setPosition(teacher.position);
    setDepartment(teacher.department || '');
    setEmail(teacher.email || '');
    setQualification(teacher.qualification || '');
    setIsEditModalOpen(true);
  };

  const handleImageClick = (teacher) => {
    setSelectedTeacher(teacher);
    const currentImg = teacher.image && teacher.image !== ""
      ? (teacher.image.startsWith('http') ? teacher.image : `${API_BASE_URL}/${teacher.image}?t=${refreshKey}`)
      : defaultAvatar;
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
        return toast.error('Please fill Name and Position');
      }
      const updatedTeacher = {
        name: name,
        position: position,
        department: department,
        email: email,
        qualification: qualification
      };
      await axios.put(`${API_BASE_URL}/teachers/${selectedTeacher.id}`, updatedTeacher);
      fetchTeachers();
      setIsEditModalOpen(false);
      toast.success('Details updated!');
    } catch (error) {
      console.error('Teacher details update error:', error.response?.data || error);
      toast.error('Update failed');
    }
  };

  const handleImageUpdate = async () => {
    if (!imageFile) return toast.error("Select an image first");
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', name || selectedTeacher.name);
    formData.append('position', position || selectedTeacher.position);
    formData.append('department', department || selectedTeacher.department || '');
    formData.append('email', email || selectedTeacher.email || '');
    formData.append('qualification', qualification || selectedTeacher.qualification || '');

    try {
      await axios.put(`${API_BASE_URL}/teachers/${selectedTeacher.id}`, formData);
      fetchTeachers();
      setIsImageModalOpen(false);
      setImageFile(null);
      toast.success('Photo updated!');
    } catch (error) {
      console.error('Teacher photo update error:', error.response?.data || error);
      toast.error('Photo update failed');
    }
  };

  const handleAddTeacher = async () => {
    if (!name || !position) {
      return toast.error('Please fill Name and Position');
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('position', position);
    formData.append('department', department);
    formData.append('email', email);
    formData.append('qualification', qualification);
    if (imageFile) formData.append('image', imageFile);

    try {
      await axios.post(`${API_BASE_URL}/teachers`, formData);
      fetchTeachers();
      setIsAddTeacherModalOpen(false);
      resetForm();
      toast.success('New teacher added!');
    } catch (error) {
      console.error('Add teacher error:', error.response?.data || error);
      toast.error('Failed to add teacher');
    }
  };

  const handleRemove = async (id) => {
    try {
      console.log('Attempting to delete teacher ID:', id);
      const response = await axios.delete(`${API_BASE_URL}/teachers/${id}`);
      console.log('Delete response:', response.data);
      fetchTeachers();
      toast.success('Removed successfully');
    } catch (error) {
      console.error('Delete teacher error:', error.response?.data || error.message);
      toast.error('Failed to remove');
    }
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Remove this teacher?</p>
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
    setDepartment('');
    setEmail('');
    setQualification('');
    setImageFile(null);
    setImagePreview(null);
    setSelectedTeacher(null);
  };

  const imageShape = { borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10 px-4 font-sans text-[18px]">

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Admin <span className="text-indigo-600">Faculty</span> Panel
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 border border-indigo-100 shadow-sm">
             <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
             <span className="text-indigo-700 font-bold text-xs uppercase tracking-wider">{teachers.length} Active Records</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDraggingEnabled(!isDraggingEnabled)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${isDraggingEnabled ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            title={isDraggingEnabled ? "Click to disable drag mode" : "Click to enable drag mode"}
          >
            <FaGripVertical /> {isDraggingEnabled ? 'Drag Mode ON' : 'Drag Mode OFF'}
          </button>
          <button
            onClick={() => { resetForm(); setIsAddTeacherModalOpen(true); }}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 font-bold text-sm uppercase tracking-widest"
          >
            <FaPlus /> Add New Teacher
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {teachers.map((teacher) => {
          const isHovered = hoveredId === teacher.id;
          const isDragged = draggedTeacher?.id === teacher.id;
          const isDragOverThis = dragOverTeacher?.id === teacher.id;
          const teacherImg = teacher.image && teacher.image !== ""
            ? (teacher.image.startsWith('http') ? teacher.image : `${API_BASE_URL}/${teacher.image}?t=${refreshKey}`)
            : defaultAvatar;
          return (
            <div
              key={teacher.id}
              draggable={isDraggingEnabled}
              onDragStart={(e) => isDraggingEnabled && handleDragStart(e, teacher)}
              onDragOver={(e) => isDraggingEnabled && handleDragOver(e, teacher)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => isDraggingEnabled && handleDrop(e, teacher)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(teacher.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 border flex flex-col items-center cursor-${isDraggingEnabled ? 'grab' : 'default'} ${isDragged ? 'opacity-50 scale-95 border-amber-400 shadow-none' : isDragOverThis ? 'border-indigo-500 shadow-indigo-200 shadow-xl scale-102' : 'border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] hover:shadow-indigo-100 hover:shadow-2xl hover:-translate-y-2'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />

              {isDraggingEnabled && (
                <div className="absolute top-4 left-4 z-20 p-2 text-amber-500 cursor-grab active:cursor-grabbing">
                  <FaGripVertical size={18} />
                </div>
              )}

              <button
                onClick={() => confirmDelete(teacher.id)}
                className="absolute top-5 right-5 z-20 p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Remove Record"
              >
                <FaTrash size={18} />
              </button>

              <div className="relative mb-6 z-10 mt-6">
                <div
                  style={{
                      ...imageShape,
                      ...(isHovered ? { borderRadius: "40%" } : {}),
                      backgroundColor: teacher.image ? 'transparent' : '#f8fafc'
                  }}
                  className="w-32 h-32 md:w-36 md:h-36 overflow-hidden transition-all duration-700 ring-4 ring-white shadow-lg flex items-center justify-center cursor-pointer group/camera"
                  onClick={() => handleImageClick(teacher)}
                >
                  <img
                    alt={teacher.name}
                    src={teacherImg}
                    className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'} ${!teacher.image && 'w-1/2 h-1/2 opacity-30'}`}
                    onError={(e) => { e.currentTarget.src = altpic; }}
                  />

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/camera:opacity-100 transition-opacity flex items-center justify-center">
                    <FaCamera className="text-white text-2xl drop-shadow-md" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center w-full">
                <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors truncate px-2">
                  {teacher.name}
                </h3>
                <p className="text-indigo-500 font-semibold text-[10px] uppercase tracking-[0.2em] mt-1">
                  {teacher.position || "Faculty Member"}
                </p>
                <p className="text-slate-500 text-[11px] font-medium mt-2 mb-4 truncate">
                  {teacher.department || "No Department"}
                </p>

                <div className="space-y-3 w-full border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-indigo-100 shadow-inner group-hover:shadow-none">
                    <FaGraduationCap className="text-indigo-500 flex-shrink-0" size={14} />
                    <span className="text-[11px] font-bold text-slate-600 truncate uppercase">
                      {teacher.qualification || "No Qual Added"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-indigo-100 shadow-inner group-hover:shadow-none">
                    <FaEnvelope className="text-indigo-500 flex-shrink-0" size={12} />
                    <span className="text-[11px] font-medium text-slate-500 truncate lowercase italic">
                      {teacher.email || "No Email Added"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleEditClick(teacher)}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-md hover:shadow-indigo-200"
                >
                  <FaUserEdit /> Edit Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(isAddTeacherModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 opacity-10" />
            <div className="relative p-6 sm:p-10 overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 mb-3 font-bold">Teacher Profile</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isAddTeacherModalOpen ? "New Teacher" : "Edit Profile"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 max-w-xl">
                    Fill the details below to {isAddTeacherModalOpen ? "add a new faculty member" : "update the teacher profile"}.
                  </p>
                </div>
                <button
                  onClick={() => { setIsAddTeacherModalOpen(false); setIsEditModalOpen(false); }}
                  className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Full Name</label>
                  <input
                    type="text"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Position</label>
                  <input
                    type="text"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Senior Lecturer"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Department</label>
                  <select
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Official Email</label>
                  <input
                    type="email"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@institute.edu.bd"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Qualification</label>
                  <input
                    type="text"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. PhD in Engineering"
                  />
                </div>

                {isAddTeacherModalOpen && (
                  <div className="grid gap-3 pt-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Profile Image</label>
                    <label className="group relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-center transition hover:border-indigo-300 hover:bg-slate-100">
                      {imagePreview ? (
                        <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FaCamera className="text-3xl" />
                          <span className="text-[11px] font-semibold">Click to Upload</span>
                        </div>
                      )}
                      <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={isAddTeacherModalOpen ? handleAddTeacher : handleSaveDetails}
                className="mt-10 inline-flex w-full items-center justify-center rounded-[2rem] bg-indigo-600 px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                {isAddTeacherModalOpen ? "Confirm Addition" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Update Photo</h3>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <img src={imagePreview} className="w-full h-full object-cover rounded-[2rem] border-8 border-slate-50 shadow-inner" alt="Preview" />
              <div className="absolute -bottom-3 -right-3 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                <FaCamera size={16} />
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handleFileChange} />
            <label htmlFor="photo-upload" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-600 mb-4 transition-all uppercase text-[10px] tracking-widest">
              Choose New Photo
            </label>
            <div className="flex gap-4">
              <button onClick={() => {setIsImageModalOpen(false); setSelectedTeacher(null);}} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-800 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleImageUpdate} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all uppercase text-[10px] tracking-widest">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Teachers;
