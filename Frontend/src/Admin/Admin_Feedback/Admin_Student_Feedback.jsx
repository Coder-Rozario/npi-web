import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faTimes,
  faCheck,
  faEye,
  faUserGraduate,
  faCalendarAlt,
  faQuoteLeft,
  faLayerGroup,
  faCheckCircle,
  faTrashAlt,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, placeholderImage } from "../../apiConfig";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaGripVertical } from "react-icons/fa";

const Admin_Student_Feedback = () => {
  const [student_Feedbacks, setStudent_Feedbacks] = useState([]);
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewedFeedbacks, setViewedFeedbacks] = useState(() => {
    const savedFeedbacks = localStorage.getItem("viewedFeedbacks");
    return savedFeedbacks ? JSON.parse(savedFeedbacks) : [];
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-feedbacks`);
      const data = response.data;
      const sortedFeedbacks = [...data].sort((a, b) => {
        const oA = typeof a.order_index === 'number' ? a.order_index : 0;
        const oB = typeof b.order_index === 'number' ? b.order_index : 0;
        if (oA !== oB) return oA - oB;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setStudent_Feedbacks(sortedFeedbacks);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    const intervalId = setInterval(fetchFeedbacks, 15000);
    return () => clearInterval(intervalId);
  }, [fetchFeedbacks]);

  const handleDragStart = (e, fb) => {
    setDraggedItem(fb);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, fb) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(fb);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, targetFb) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetFb.id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedIndex = student_Feedbacks.findIndex(f => f.id === draggedItem.id);
    const targetIndex = student_Feedbacks.findIndex(f => f.id === targetFb.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newList = [...student_Feedbacks];
    const [moved] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, moved);

    setStudent_Feedbacks(newList);
    setDraggedItem(null);
    setDragOverItem(null);

    try {
      const orders = newList.map((f, index) => ({ id: f.id, order_index: index }));
      await axios.put(`${API_BASE_URL}/student-feedback-reorder`, { orders });
      toast.success('Feedback reordered!');
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Failed to save order');
      fetchFeedbacks();
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const filteredFeedbacks = student_Feedbacks.filter((f) => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteFeedback = async (id) => {
    if (!id) {
      toast.error("Invalid feedback ID.");
      return;
    }
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete-sfeedback/${id}`);
      if (response.status === 200) {
        setStudent_Feedbacks((prev) => prev.filter((f) => f.id !== id));
        setSelectedFeedback(null);
        toast.success("Feedback removed successfully.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Error deleting feedback.");
    }
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this feedback?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { deleteFeedback(id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const handleApprove = async (id) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/accept-feedback/${id}`);
      if (response.status === 200) {
        setStudent_Feedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, accepted: true } : f)));
        if (selectedFeedback) setSelectedFeedback(prev => ({ ...prev, accepted: true }));
        toast.success("Feedback approved for public view!");
      }
    } catch (err) {
      console.error("Approval error:", err);
      toast.error(err.response?.data?.message || "Approval failed.");
    }
  };

  const handleViewFeedback = (feedback) => {
    if (!viewedFeedbacks.includes(feedback.id)) {
      const updated = [...viewedFeedbacks, feedback.id];
      setViewedFeedbacks(updated);
      localStorage.setItem("viewedFeedbacks", JSON.stringify(updated));
    }
    setSelectedFeedback(feedback);
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return placeholderImage(150);
    const correctedPath = photoPath.replace(/\\/g, '/');
    return `${API_BASE_URL}/${correctedPath}`;
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Feedback</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage student testimonials and feedback</p>
            <div className="h-1 w-20 bg-blue-600 mt-4 rounded-full"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 pl-12 focus:border-blue-600 focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => setIsDraggingEnabled(!isDraggingEnabled)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${isDraggingEnabled ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              title={isDraggingEnabled ? "Click to disable drag mode" : "Click to enable drag mode"}
            >
              <FaGripVertical /> {isDraggingEnabled ? 'Drag Mode ON' : 'Drag Mode OFF'}
            </button>
          </div>
        </header>


        {error && (
          <div className="error-box">
            <span className="error-dot"></span>
            {error}
          </div>
        )}

        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Total</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{student_Feedbacks.length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Pending</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{student_Feedbacks.filter(f => !f.accepted).length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-green-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Accepted</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{student_Feedbacks.filter(f => f.accepted).length}</p>
          </div>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No feedback submissions found.</p>
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeedbacks.map((feedback) => {
              const isDragged = draggedItem?.id === feedback.id;
              const isDragOverThis = dragOverItem?.id === feedback.id;
              return (
                <div
                  key={feedback.id}
                  draggable={isDraggingEnabled}
                  onDragStart={(e) => isDraggingEnabled && handleDragStart(e, feedback)}
                  onDragOver={(e) => isDraggingEnabled && handleDragOver(e, feedback)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => isDraggingEnabled && handleDrop(e, feedback)}
                  onDragEnd={handleDragEnd}
                  className={`feedback-card ${(feedback.accepted || viewedFeedbacks.includes(feedback.id)) ? "viewed" : "new"}`}
                  style={{
                    opacity: isDragged ? 0.5 : 1,
                    transform: isDragged ? 'scale(0.97)' : (isDragOverThis ? 'scale(1.02)' : 'none'),
                    border: isDragOverThis ? '2px dashed #f59e0b' : undefined,
                    cursor: isDraggingEnabled ? 'grab' : 'default',
                    position: 'relative'
                  }}
                >
                  {isDraggingEnabled && (
                    <div className="absolute top-3 left-3 z-20 p-1.5 text-amber-500 bg-amber-50 rounded-lg cursor-grab active:cursor-grabbing shadow-sm border border-amber-200">
                      <FaGripVertical size={14} />
                    </div>
                  )}
                  <div className="card-header" style={isDraggingEnabled ? { paddingTop: '2.5rem' } : {}}>
                    <div className="student-info">
                      <img
                        src={getImageUrl(feedback.photo_path)}
                        alt={feedback.name}
                        className="student-thumb"
                      />
                      <div>
                        <h3 className="student-name">{feedback.name}</h3>
                        <p className="student-dept">{feedback.department}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${feedback.accepted ? "status-live" : "status-pending"}`}>
                      {feedback.accepted ? "Live" : "Pending"}
                    </span>
                  </div>

                  <p className="card-message">"{feedback.message}"</p>

                  <div className="card-footer">
                    <div className="action-btns">
                      <button onClick={() => handleViewFeedback(feedback)} className="btn-icon btn-view">
                        <FontAwesomeIcon icon={faEye} size="sm" />
                      </button>
                      <button onClick={() => confirmDelete(feedback.id)} className="btn-icon btn-delete">
                        <FontAwesomeIcon icon={faTrash} size="sm" />
                      </button>
                    </div>

                    {!feedback.accepted && (
                      <button onClick={() => handleApprove(feedback.id)} className="btn-approve-small">
                        <FontAwesomeIcon icon={faCheck} className="mr-2" /> Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      
      {selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setSelectedFeedback(null)}></div>
          
          <div className="modal-container">
            <button onClick={() => setSelectedFeedback(null)} className="modal-close-btn">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>

            
            <div className="modal-left">
              <div className="glow-effect"></div>
              <img
                src={getImageUrl(selectedFeedback.photo_path)}
                className="modal-profile-img"
                alt="Student"
              />
              <h3 className="modal-student-name">{selectedFeedback.name}</h3>
              <div className="modal-meta-list">
                <div className="meta-item">
                  <FontAwesomeIcon icon={faUserGraduate} className="meta-icon" />
                  <span className="truncate">{selectedFeedback.department}</span>
                </div>
                <div className="meta-item">
                  <FontAwesomeIcon icon={faLayerGroup} className="meta-icon" />
                  <span>Semester: {selectedFeedback.semester || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
                  <span>{new Date(selectedFeedback.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            
            <div className="modal-right">
              <div className="modal-body custom-scrollbar">
                <div className="testimonial-header">
                  <div className="quote-badge">
                    <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
                  </div>
                  <span className="testimonial-label">Student Testimonial</span>
                </div>
                
                <div className="testimonial-content">
                  <p className="testimonial-text">{selectedFeedback.message}</p>
                </div>
              </div>

              <div className="modal-footer">
                <div className="footer-main-actions">
                  {!selectedFeedback.accepted ? (
                    <button onClick={() => handleApprove(selectedFeedback.id)} className="btn-approve-large">
                      <FontAwesomeIcon icon={faCheckCircle} /> 
                      <span>Approve Feedback</span>
                    </button>
                  ) : (
                    <div className="live-status-indicator">
                      <div className="live-dot-container">
                        <div className="live-dot"></div>
                        <div className="live-dot-pulse"></div>
                      </div>
                      <span>Live on Website</span>
                    </div>
                  )}
                  <button onClick={() => confirmDelete(selectedFeedback.id)} className="btn-delete-large">
                    <FontAwesomeIcon icon={faTrashAlt} />
                    <span>Delete</span>
                  </button>
                </div>
                <button onClick={() => setSelectedFeedback(null)} className="btn-dismiss">
                  <span>Dismiss View</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          width: 100%;
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 2rem 1rem;
          font-family: sans-serif;
          color: #0f172a;
        }
        .content-wrapper {
          max-width: 1152px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 2.5rem;
          text-align: center;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.025em;
        }
        .highlight { color: #4f46e5; }
        .subtitle {
          margin-top: 0.5rem;
          color: #64748b;
          font-weight: 500;
        }
        .title-underline {
          height: 6px;
          width: 64px;
          background-color: #4f46e5;
          margin: 1rem auto 0;
          border-radius: 9999px;
        }
        .error-box {
          padding: 1rem;
          margin-bottom: 1.5rem;
          background-color: #fef2f2;
          color: #b91c1c;
          border-radius: 1rem;
          border: 1px solid #fee2e2;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .error-dot {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .empty-state {
          text-align: center;
          padding: 6rem 0;
          background-color: white;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .empty-text { color: #94a3b8; font-size: 1.125rem; }
        .feedback-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .feedback-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .feedback-card {
          background-color: white;
          border-radius: 1rem;
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }
        .feedback-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }
        .feedback-card.new {
          border-color: #e2e8f0;
          background-color: #f8fafc;
          border-left: 4px solid #0f172a;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }
        .feedback-card.new::after {
          content: "NEW";
          position: absolute;
          top: 0;
          right: 0;
          background: #0f172a;
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 8px;
          border-bottom-left-radius: 8px;
        }
        .feedback-card.viewed { opacity: 1; background-color: white; }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .student-info { display: flex; align-items: center; gap: 0.75rem; }
        .student-thumb {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .student-name { font-weight: 700; color: #1e293b; line-height: 1.25; margin: 0; }
        .student-dept { font-size: 0.75rem; color: #64748b; font-weight: 500; margin: 0; }
        .status-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-live { background-color: #ecfdf5; color: #059669; }
        .status-pending { background-color: #fffbeb; color: #d97706; }
        .card-message {
          color: #475569;
          font-size: 0.875rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-style: italic;
          margin-bottom: 1.25rem;
          line-height: 1.625;
        }
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f8fafc;
          padding-top: 1rem;
        }
        .action-btns { display: flex; gap: 0.5rem; }
        .btn-icon {
          height: 2.25rem;
          width: 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: background-color 0.2s, color 0.2s;
          border: none;
          cursor: pointer;
        }
        .btn-view { background-color: #f5f3ff; color: #4f46e5; }
        .btn-view:hover { background-color: #4f46e5; color: white; }
        .btn-delete { background-color: #fef2f2; color: #ef4444; }
        .btn-delete:hover { background-color: #ef4444; color: white; }
        .btn-approve-small {
          padding: 0.5rem 1rem;
          background-color: #059669;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-approve-small:hover { background-color: #047857; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-backdrop {
          position: absolute;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
        }
        .modal-container {
          position: relative;
          background-color: white;
          width: 100%;
          max-width: 85%;
          height: auto;
          min-height: 500px;
          overflow: hidden;
          border-radius: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          animation: zoomIn 0.2s ease-out;
        }
        @media (min-width: 768px) {
          .modal-container { flex-direction: row; height: 700px; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 30;
          width: 3rem;
          height: 3rem;
          background-color: #f1f5f9;
          border-radius: 50%;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover { color: #ef4444; transform: rotate(90deg); }
        
        .modal-left {
          width: 100%;
          background-color: #0f172a;
          padding: 2.5rem;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        }
        @media (min-width: 768px) { .modal-left { width: 35%; } }
        
        .glow-effect {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          pointer-events: none;
          overflow: hidden;
        }
        .glow-effect::before {
          content: "";
          position: absolute;
          top: -10%; right: -10%;
          width: 16rem; height: 16rem;
          background-color: #6366f1;
          border-radius: 50%;
          filter: blur(64px);
        }
        .modal-profile-img {
          width: 10rem;
          height: 10rem;
          border-radius: 2rem;
          object-fit: cover;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          ring: 8px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
        }
        .modal-student-name {
          font-size: 1.875rem;
          font-weight: 900;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }
        .modal-meta-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          max-width: 240px;
          position: relative;
          z-index: 10;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #cbd5e1;
          background-color: rgba(255, 255, 255, 0.05);
          padding: 0.875rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
        .meta-icon { color: #818cf8; width: 1.25rem; }

        .modal-right {
          width: 100%;
          display: flex;
          flex-direction: column;
          background-color: white;
        }
        @media (min-width: 768px) { .modal-right { width: 65%; } }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem;
        }
        @media (min-width: 768px) { .modal-body { padding: 4rem; } }
        
        .testimonial-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .quote-badge {
          width: 3.5rem;
          height: 3.5rem;
          background: linear-gradient(135deg, #6366f169 0%, #4f46e514 100%);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }
        .testimonial-label {
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.813rem;
          color: #64748b;
        }
        .testimonial-content {
          position: relative;
          padding: 2rem;
          background-color: #f8fafc;
          border-radius: 2rem;
          border: 1px solid #f1f5f9;
        }
        .testimonial-text {
          color: #1e293b;
          line-height: 1.8;
          font-size: 1.125rem;
          font-weight: 500;
          font-style: italic;
          margin: 0;
        }
        
        .modal-footer {
          padding: 2rem 2.5rem;
          background-color: white;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .modal-footer {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .footer-main-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .btn-approve-large {
          padding: 0.875rem 1.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 10px 15px -3px rgba(16, 185, 129, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-approve-large:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2);
          filter: brightness(1.1);
        }
        .btn-approve-large:active { transform: translateY(0); }
        
        .live-status-indicator {
          padding: 0.875rem 1.75rem;
          background-color: #f0fdf4;
          color: #166534;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          border: 1px solid #dcfce7;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .live-dot-container {
          position: relative;
          width: 10px;
          height: 10px;
        }
        .live-dot {
          width: 10px;
          height: 10px;
          background-color: #22c55e;
          border-radius: 50%;
          position: relative;
          z-index: 2;
        }
        .live-dot-pulse {
          position: absolute;
          inset: -4px;
          background-color: #22c55e;
          border-radius: 50%;
          opacity: 0.4;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        .btn-delete-large {
          padding: 0.875rem 1.75rem;
          background-color: #fff1f2;
          color: #e11d48;
          border: 1px solid #ffe4e6;
          border-radius: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.3s;
        }
        .btn-delete-large:hover { 
          background-color: #e11d48; 
          color: white;
          box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2);
        }
        
        .btn-dismiss {
          padding: 0.875rem 1.25rem;
          color: #64748b;
          font-weight: 700;
          background-color: #f1f5f9;
          border: none;
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-dismiss:hover { 
          background-color: #e2e8f0;
          color: #0f172a;
          transform: translateX(4px);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #e2e8f0; 
          border-radius: 20px;
          transition: background 0.3s;
        }
        .modal-body:hover.custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Admin_Student_Feedback;
