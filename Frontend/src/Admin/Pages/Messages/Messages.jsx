import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash, faTimes, faEnvelope, faPhone, faClock, faUser } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-messages`);
      if (Array.isArray(response.data)) {
        const sortedMessages = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMessages(sortedMessages);
      } else {
        console.error('Unexpected messages data format:', response.data);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMessage = async (id) => {
    if (!id) {
      toast.error("Invalid message ID.");
      return;
    }
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete-message/${id}`);
      if (response.status === 200) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));
        toast.success("Message deleted successfully.", { autoClose: 1000 });
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete message.");
    }
  };

  const filteredMessages = messages.filter((msg) =>
    msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800">Move to Trash?</p>
        <p className="text-xs text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 text-xs bg-gray-100 rounded" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1 text-xs bg-red-600 text-white rounded shadow-sm" onClick={() => { deleteMessage(id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const handleViewMessage = async (msg) => {
    if (!msg.is_viewed) {
      try {
        const response = await authFetch(`${API_BASE_URL}/update-message-status/${msg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_viewed: 1 }),
        });
        if (response.ok) {
          setMessages((prevMessages) =>
            prevMessages.map((message) => (message.id === msg.id ? { ...message, is_viewed: 1 } : message))
          );
        }
      } catch { console.error("Error updating status."); }
    }
    setSelectedMessage(msg);
  };

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 font-sans w-full text-[18px]">

      <style dangerouslySetInnerHTML={{ __html: `
        .message-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .message-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); }
        .custom-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-modal { animation: fadeIn 0.2s ease-out forwards; }
      ` }} />

      <div className="w-full">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inbox Messages</h1>
            <p className="text-slate-500 mt-2 font-medium">You have {messages.filter(m => !m.is_viewed).length} unread messages</p>
            <div className="h-1 w-20 bg-slate-900 mt-4 rounded-full"></div>
          </div>

          <div className="relative w-full md:w-80 group">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 pl-12 focus:border-slate-900 focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </header>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <FontAwesomeIcon icon={faEnvelope} className="text-slate-200 text-6xl mb-4" />
            <p className="text-slate-400 font-medium italic">{searchQuery ? "No messages found for your search." : "Your inbox is empty..."}</p>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-5">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-card group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden ${!msg.is_viewed ? 'ring-1 ring-slate-900/5 bg-slate-50/30 border-l-4 border-l-slate-900' : ''}`}
                >
                  {!msg.is_viewed && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                      New
                    </div>
                  )}
                  <div className="flex items-center gap-4 w-full">

                    <div className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${!msg.is_viewed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {msg.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-bold truncate ${!msg.is_viewed ? 'text-slate-900' : 'text-slate-600'}`}>{msg.name}</h3>
                        {!msg.is_viewed && <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse"></span>}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faEnvelope} /> {msg.email || "No Email"}</span>
                        <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                    <button
                      onClick={() => handleViewMessage(msg)}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEye} /> Read
                    </button>
                    <button
                      onClick={() => confirmDelete(msg.id)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setSelectedMessage(null)}></div>

          <div className="custom-glass relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-modal">

            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <FontAwesomeIcon icon={faUser} size="lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedMessage.name}</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Message Details</p>
                </div>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-all">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="px-8 pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase">Contact Email</p>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={faEnvelope} className="text-slate-300" /> {selectedMessage.email || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPhone} className="text-slate-300" /> {selectedMessage.phone || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase">Received At</p>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-slate-300" /> {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black text-indigo-500 uppercase mb-3">Conversation Message</p>
                <div className="bg-slate-50/50 rounded-2xl p-6 text-slate-700 leading-relaxed text-sm shadow-inner min-h-[150px] max-h-[300px] overflow-y-auto scrollbar-hide italic">
                  "{selectedMessage.message}"
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedMessage.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-900 text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-colors"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
