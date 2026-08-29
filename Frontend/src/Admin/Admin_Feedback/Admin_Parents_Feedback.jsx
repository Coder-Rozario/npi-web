import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import { FaTimes, FaGripVertical } from "react-icons/fa"; 
import { faCheck, faTrash, faEye, faUserTie, faQuoteLeft, faClock } from "@fortawesome/free-solid-svg-icons"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const Admin_Parents_Feedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewedPFeedbacks, setViewedPFeedbacks] = useState(() => {
    const saved = localStorage.getItem("viewedPFeedbacks");
    return saved ? JSON.parse(saved) : [];
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/all-parents-feedbacks`);
      const data = response.data;
      const sorted = [...data].sort((a, b) => {
        const oA = typeof a.order_index === 'number' ? a.order_index : 0;
        const oB = typeof b.order_index === 'number' ? b.order_index : 0;
        if (oA !== oB) return oA - oB;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      setFeedbackList(sorted);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

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

    const draggedIndex = feedbackList.findIndex(f => f.id === draggedItem.id);
    const targetIndex = feedbackList.findIndex(f => f.id === targetFb.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newList = [...feedbackList];
    const [moved] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, moved);

    setFeedbackList(newList);
    setDraggedItem(null);
    setDragOverItem(null);

    try {
      const orders = newList.map((f, index) => ({ id: f.id, order_index: index }));
      await axios.put(`${API_BASE_URL}/parents-feedback-reorder`, { orders });
      toast.success('Feedback reordered!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save order');
      fetchFeedbacks();
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const filteredFeedbacks = feedbackList.filter((f) => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPhotoUrl = (photoPath) => {
    if (!photoPath || typeof photoPath !== 'string') return null;
    const urlRegex = /^(https?:)?\/\//;
    if (urlRegex.test(photoPath) || photoPath.startsWith('data:')) {
      return photoPath;
    }
    const normalized = photoPath.replace(/\\/g, '/');
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    if (!cleanPath) return null;
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/uploads/${cleanPath}`;
  };

  const hasPhoto = (fb) => {
    if (!fb) return false;
    return !!getPhotoUrl(fb.photo) || !!getPhotoUrl(fb.photo_path) || !!getPhotoUrl(fb.photo_url);
  };

  const getAvatarSrc = (fb) => {
    if (!fb) return null;
    return getPhotoUrl(fb.photo) || getPhotoUrl(fb.photo_path) || getPhotoUrl(fb.photo_url);
  };

  const handleApprove = async (id) => {
    if (!id) {
      toast.error("Invalid feedback ID.");
      return;
    }
    try {
      const response = await axios.put(`${API_BASE_URL}/approve-feedback/${id}`);
      if (response.status === 200) {
        toast.success("Feedback approved successfully!", { autoClose: 1500 });
        fetchFeedbacks();
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Approval failed.");
    }
  };

  const handleDelete = (id) => {
    toast(
      ({ closeToast }) => (
        <div className="p-2">
          <p className="font-semibold text-slate-800">Confirm Deletion?</p>
          <p className="text-sm text-slate-500 mb-4">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button
              className="py-1.5 px-4 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-all"
              onClick={closeToast}
            >
              Cancel
            </button>
            <button
              className="py-1.5 px-4 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-all shadow-md shadow-red-100"
              onClick={() => {
                deleteFeedback(id);
                closeToast();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { autoClose: false, position: "top-right" }
    );
  };

  const deleteFeedback = async (id) => {
    if (!id) {
      toast.error("Invalid feedback ID.");
      return;
    }
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete-feedback/${id}`);
      if (response.status === 200) {
        fetchFeedbacks();
        toast.success("Feedback removed.", { autoClose: 1500 });
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Error deleting feedback.");
    }
  };

  const handleViewFeedback = (feedback) => {
    if (!viewedPFeedbacks.includes(feedback.id)) {
      const updated = [...viewedPFeedbacks, feedback.id];
      setViewedPFeedbacks(updated);
      localStorage.setItem("viewedPFeedbacks", JSON.stringify(updated));
    }
    setSelectedFeedback(feedback);
  };

  return (
    <div className="min-h-screen w-[100%] bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
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
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Parents <span className="text-blue-600">Feedback</span>
            </h1>
            <div className="h-1.5 w-20 bg-blue-600 rounded-full mb-4 mx-auto md:mx-0"></div>
            <p className="text-slate-500 max-w-md">
              Review and manage testimonials from parents to improve institutional quality.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 pl-12 focus:border-blue-600 focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 shadow-sm hover:border-slate-300"
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
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Total</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{feedbackList.length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Pending</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{feedbackList.filter(f => !f.approved).length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-green-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Accepted</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{feedbackList.filter(f => f.approved).length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
            <p className="text-slate-400 text-xl font-medium">{searchQuery ? "No matching feedback found." : "No feedback entries found."}</p>
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
                  className={`feedback-card ${(feedback.approved || viewedPFeedbacks.includes(feedback.id)) ? "viewed" : "new"} ${isDraggingEnabled ? 'drag-enabled' : ''} ${isDragged ? 'dragging' : ''} ${isDragOverThis ? 'drag-over' : ''}`}
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
                      {getAvatarSrc(feedback) ? (
                        <img
                          key={`card-photo-${feedback.id}`}
                          src={getAvatarSrc(feedback)}
                          alt={feedback.name || 'Profile'}
                          className="student-thumb"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling;
                            if (fb && fb.classList.contains('avatar-fallback')) {
                              fb.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`student-thumb bg-blue-50 flex items-center justify-center text-blue-600 border-2 border-white shadow-md avatar-fallback ${getAvatarSrc(feedback) ? '' : ''}`}
                        style={getAvatarSrc(feedback) ? { display: 'none' } : {}}
                      >
                        <FontAwesomeIcon icon={faUserTie} size="lg" />
                      </div>
                      <div>
                        <h3 className="student-name">{feedback.name}</h3>
                        <p className="student-dept">{feedback.occupation}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${feedback.approved ? "status-live" : "status-pending"}`}>
                      {feedback.approved ? "Live" : "Pending"}
                    </span>
                  </div>

                  <p className="card-message">"{feedback.message}"</p>

                  <div className="card-footer">
                    <div className="action-btns">
                      <button onClick={() => handleViewFeedback(feedback)} className="btn-icon btn-view">
                        <FontAwesomeIcon icon={faEye} size="sm" />
                      </button>
                      <button onClick={() => handleDelete(feedback.id)} className="btn-icon btn-delete">
                        <FontAwesomeIcon icon={faTrash} size="sm" />
                      </button>
                    </div>

                    {!feedback.approved && (
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFeedback(null)}
          ></div>
          
          <div className="glass-effect relative w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-in border border-white/20">
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                {getAvatarSrc(selectedFeedback) ? (
                  <img
                    key={`modal-photo-${selectedFeedback.id}`}
                    src={getAvatarSrc(selectedFeedback)}
                    alt={selectedFeedback.name || 'Profile'}
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-lg shadow-blue-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling;
                      if (fb && fb.classList.contains('avatar-fallback')) {
                        fb.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200 avatar-fallback ${getAvatarSrc(selectedFeedback) ? '' : ''}`}
                  style={getAvatarSrc(selectedFeedback) ? { display: 'none' } : {}}
                >
                  {selectedFeedback.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedFeedback.name}</h2>
                  <p className="text-blue-600 font-bold text-sm tracking-wide">{selectedFeedback.occupation}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="px-8 pb-8 pt-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                <FontAwesomeIcon icon={faClock} /> 
                Submitted on {new Date(selectedFeedback.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              
              <div className="relative">
                <FontAwesomeIcon icon={faQuoteLeft} className="absolute -top-4 -left-2 text-slate-100 text-6xl -z-10" />
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-slate-700 text-lg leading-relaxed text-justify whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 bg-slate-50/80 border-t border-slate-100 flex gap-4">
              {!selectedFeedback.approved && (
                <button
                  onClick={() => { handleApprove(selectedFeedback.id); setSelectedFeedback(null); }}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Approve Feedback
                </button>
              )}
              <button
                onClick={() => setSelectedFeedback(null)}
                className="flex-1 bg-white text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Parents_Feedback;
