import { API_BASE_URL, authFetch, getAuthToken } from "../../../apiConfig";
import { clearDataCache } from "../../../hooks/useFetchData";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt, faFileAlt, faCalendarDay, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineFile, AiOutlineCloudUpload } from "react-icons/ai";
import { MdClose } from "react-icons/md";

const All_Notice = () => {
  const [notices, setNotices] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState("");


  const styles = {
    container: {
      padding: "20px",
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      borderRadius: "20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      fontFamily: "'Inter', sans-serif"
    },
    tableHead: {
      backgroundColor: "#f8fafc",
      color: "#64748b",
      textTransform: "uppercase",
      fontSize: "12px",
      letterSpacing: "1px",
      fontWeight: "700"
    },
    actionBtn: {
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 12px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "600"
    },
    modalOverlay: {
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(6px)"
    }
  };

  const fetchNotices = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? `${API_BASE_URL}/get-notices?nocache=${Date.now()}` : `${API_BASE_URL}/get-notices`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      setNotices(data);
    } catch (error) {
      toast.error("Failed to load notices");
    }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDeleteDocument = async (notice) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/delete-notice/${notice.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setNotices(notices.filter((n) => n.id !== notice.id));
        toast.success("Notice removed successfully");

        // Clear hooks cache and force immediate fresh fetch to avoid showing stale cached data
        try { clearDataCache('/get-notices'); } catch (e) {}
        fetchNotices(true);
      }
    } catch (error) { toast.error("Error deleting notice"); }
  };

  const confirmDelete = (notice) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this notice?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { handleDeleteDocument(notice); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const openEditModal = (notice) => {
    setCurrentNotice(notice);
    setNewTitle(notice.title);
    setFiles([]);
    setEditModalOpen(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setNewFile(selectedFiles[0]);

    setProgress((prev) => ({ ...prev, [selectedFiles[0].name]: 100 }));
  };

  const handleSubmit = async () => {
    if (!newTitle) { toast.error("Title is required"); return; }
    
    const formData = new FormData();
    formData.append("title", newTitle);
    if (newFile) formData.append("file", newFile);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${API_BASE_URL}/edit-notice/${currentNotice.id}`, true);

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (newFile) setProgress((prev) => ({ ...prev, [newFile.name]: 0 }));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && newFile) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress((prev) => ({ ...prev, [newFile.name]: Math.min(percent, 99) }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        if (newFile) setProgress((prev) => ({ ...prev, [newFile.name]: 100 }));
        setTimeout(() => {
            fetchNotices();
            setEditModalOpen(false);
            toast.success("Updated successfully!");
        }, 300);
      }
    };
    xhr.send(formData);
  };

  return (
    <div style={styles.container}>
      

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <FontAwesomeIcon icon={faFileAlt} className="text-blue-500" /> Notice Archive
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Manage and search institute notices</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 pl-12 focus:border-blue-600 focus:bg-white focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 shadow-sm"
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
      </div>

      <div className="max-h-[75vh] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={styles.tableHead}>
              <th className="p-5">Date Uploaded</th>
              <th className="p-5">Notice Title</th>
              <th className="p-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredNotices.length > 0 ? (
              filteredNotices.map((notice) => (
                <tr key={notice.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 text-sm font-semibold text-slate-500 whitespace-nowrap">
                     <FontAwesomeIcon icon={faCalendarDay} className="mr-2 text-slate-300" />
                     {formatDate(notice.uploaded_at)}
                  </td>
                  <td className="p-4">
                      <p className="text-sm font-bold text-slate-700 leading-6">{notice.title}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => openEditModal(notice)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                        style={styles.actionBtn}
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" /> Edit
                      </button>

                      <button
                        onClick={() => confirmDelete(notice)}
                        className="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white"
                        style={styles.actionBtn}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-20 text-center text-slate-400 font-medium italic">
                  {searchQuery ? "No notices match your search." : "No notices found in the archive."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      {editModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-[100] p-4" style={styles.modalOverlay}>
          <div className="bg-white w-full max-w-[50%] rounded-[24px] shadow-2xl p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
            >
              <MdClose className="text-xl" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 mb-2">Edit Notice</h2>
            <p className="text-slate-400 text-sm mb-8">Update the title or replace the document file.</p>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notice Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 border text-slate-700 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Upload New Document (Optional)</label>
                <div
                  onClick={() => document.getElementById("notice_img").click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <AiOutlineCloudUpload className="text-4xl text-slate-300 group-hover:text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">Click to upload new file</p>
                  <input id="notice_img" type="file" hidden onChange={handleFileChange} />
                </div>
              </div>

              {files.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4">
                  <AiOutlineFile className="text-3xl text-blue-500" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-blue-900 truncate">{files[0].name}</p>
                      <span className="text-[10px] font-bold text-blue-600">
                        {progress[files[0].name] === 100 ? "Ready" : `${progress[files[0].name] || 0}%`}
                      </span>
                    </div>
                    <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300 ease-out rounded-full" 
                          style={{ 
                            width: `${progress[files[0].name] || 0}%`,
                            backgroundColor: (progress[files[0].name] || 0) === 100 ? "#22c55e" : "#0186C0"
                          }}
                        ></div>
                    </div>
                  </div>
                  <button onClick={() => setFiles([])} className="text-slate-400 hover:text-red-500"><MdClose size={20}/></button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                Update Notice Data
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes zoom-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
            animation: zoom-in 0.2s cubic-bezier(0, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default All_Notice;
