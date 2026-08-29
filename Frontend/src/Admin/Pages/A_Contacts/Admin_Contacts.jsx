import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapPin, Mail, Phone, Edit2, X, Check } from "lucide-react";

const Admin_Contacts = () => {
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [details, setDetails] = useState({
    address: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/contact?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error("Failed to fetch contact details");
        const data = await response.json();
        setDetails(data);
      } catch {
        toast.error("Error fetching contact details");
      }
    };
    fetchContactDetails();
  }, []);

  const handleEditClick = (field, value) => {
    setEditField(field);
    setEditValue(value);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedDetails = { ...details, [editField]: editValue };
      const response = await authFetch(`${API_BASE_URL}/contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDetails),
      });

      if (!response.ok) throw new Error("Failed to update contact details");

      setDetails(updatedDetails);
      toast.success(`${editField.charAt(0).toUpperCase() + editField.slice(1)} updated successfully!`);
      setEditField(null);
    } catch (error) {
      toast.error(error.message || "Error updating contact details");
    }
  };

  return (
    <div className="contact-page-wrapper">
      <style>{`
        .contact-page-wrapper {
          padding: 60px 20px;
          background: #f4f7f9;
          font-family: 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .main-container {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }
        .glass-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.8);
          position: relative;
        }
        .section-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 30px;
          text-align: center;
        }
        .section-title::after {
          content: '';
          display: block;
          width: 60px;
          height: 4px;
          background: #0186C0;
          margin: 10px auto 0;
          border-radius: 2px;
        }
        .info-item {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          padding: 15px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        .info-item:hover { 
          background: rgba(1, 134, 192, 0.05); 
          border-color: rgba(1, 134, 192, 0.1);
          transform: translateY(-2px);
        }
        .icon-box {
          width: 50px; height: 50px;
          background: rgba(1, 134, 192, 0.1);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #0186C0; flex-shrink: 0;
        }
        .info-content h5 { margin: 0; font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-content p { margin: 5px 0 0; font-size: 16px; color: #2d3748; font-weight: 500; word-break: break-word; }
        .map-container { margin-top: 35px; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; }
        
        @media (max-width: 480px) {
          .glass-card { padding: 25px 15px; }
          .section-title { font-size: 22px; }
        }
      `}</style>

      <div className="main-container">
        <div className="glass-card" data-aos="zoom-in">
          <h3 className="section-title">Contact Information Management</h3>
          <p style={{ fontSize: '13px', color: '#0186C0', marginBottom: '25px', textAlign: 'center', fontWeight: '600' }}>
            * Click any field to update the information
          </p>
          
          <div className="info-item" onClick={() => handleEditClick("address", details.address)}>
            <div className="icon-box"><MapPin size={24} /></div>
            <div className="info-content">
              <h5>Campus Location</h5>
              <p>{details.address || "Fetching address..."}</p>
            </div>
          </div>

          <div className="info-item" onClick={() => handleEditClick("email", details.email)}>
            <div className="icon-box"><Mail size={24} /></div>
            <div className="info-content">
              <h5>Official Email</h5>
              <p>{details.email || "Fetching email..."}</p>
            </div>
          </div>

          <div className="info-item" onClick={() => handleEditClick("phone", details.phone)}>
            <div className="icon-box"><Phone size={24} /></div>
            <div className="info-content">
              <h5>Help Desk / Phone</h5>
              <p>{details.phone || "Fetching phone..."}</p>
            </div>
          </div>

          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902269926442!2d90.3888806753359!3d23.750868878670417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8bcd6ad3fd9%3A0x3402476563608307!2sNational%20Polytechnic%20Institute!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
              width="100%" height="250" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy"
              title="office location"
            />
          </div>
        </div>
      </div>

      {editField && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[9999] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-[450px] animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-[#0186C0]"><Edit2 size={20} /></div>
              Update {editField}
            </h3>
            <textarea
              className="w-full border-2 border-gray-100 rounded-2xl p-4 mb-6 focus:border-[#0186C0] focus:ring-4 focus:ring-blue-50 outline-none text-black bg-gray-50 transition-all"
              rows="4"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter new ${editField}...`}
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                onClick={() => setEditField(null)}
              >
                <X size={18} /> Cancel
              </button>
              <button
                className="px-6 py-2.5 rounded-xl bg-[#0186C0] text-white font-bold flex items-center gap-2 hover:bg-[#016fa0] shadow-lg shadow-blue-200 transition-all"
                onClick={handleSaveEdit}
              >
                <Check size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Contacts;
