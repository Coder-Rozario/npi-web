import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { MapPin, Mail, Phone, Send } from "lucide-react";

const Contacts = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState({
    address: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/contact`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setDetails(data);
      } catch {
        toast.error("Error fetching contact details");
      }
    };
    fetchContactDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Message sent successfully!");
      setName(""); setEmail(""); setPhone(""); setMessage("");
    } catch {
      toast.error("Failed to send message. Try again.");
    }
  };

  return (
    <div className="contact-page-wrapper">
      <style>{`
        .contact-page-wrapper {
          padding: 80px 20px;
          background: #f4f7f9;
          font-family: 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
        }

        .main-container {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
        }

        .glass-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .section-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 30px;
          position: relative;
        }

        .section-title::after {
          content: '';
          display: block;
          width: 50px;
          height: 4px;
          background: #0186C0;
          margin-top: 8px;
          border-radius: 2px;
        }

        /* Form Styling */
        .input-group {
          margin-bottom: 25px;
        }

        .input-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .input-field {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          outline: none;
          background: #f8fafc;
          color: #2d3748;
        }

        .input-field:focus {
          border-color: #0186C0;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(1, 134, 192, 0.1);
        }

        .submit-btn {
          background: #0186C0;
          color: #fff;
          border: none;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
          width: fit-content;
        }

        .submit-btn:hover {
          background: #016fa0;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(1, 134, 192, 0.2);
        }

        /* Detail Sidebar Styling */
        .info-item {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
        }

        .icon-box {
          width: 45px;
          height: 45px;
          background: rgba(1, 134, 192, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0186C0;
          flex-shrink: 0;
        }

        .info-content h5 {
          margin: 0;
          font-size: 14px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-content p {
          margin: 5px 0 0;
          font-size: 16px;
          color: #2d3748;
          font-weight: 500;
          line-height: 1.5;
        }

        .map-container {
          margin-top: 30px;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }

        .map-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          overflow: hidden;
          background: #eef2ff;
        }

        .map-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .map-header {
          background: linear-gradient(135deg, #0186C0 0%, #026aa0 100%);
          color: #fff;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 15px;
        }

        .map-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 12px 18px;
          color: #475569;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .map-footer a {
          color: #0186C0;
          text-decoration: none;
          font-weight: 600;
          margin-left: auto;
        }

        .map-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .map-header { font-size: 14px; padding: 12px 14px; }
          .map-footer { font-size: 12px; padding: 10px 14px; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .main-container { grid-template-columns: 1fr; }
          .contact-page-wrapper { padding: 40px 15px; }
        }

        @media (max-width: 480px) {
          .glass-card { padding: 25px 20px; }
          .section-title { font-size: 22px; }
          .submit-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="main-container">
        <div className="glass-card" data-aos="fade-up">
          <h3 className="section-title">Send Us a Message</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name *</label>
              <input
                className="input-field"
                type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: John Doe"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-col">
              <div className="input-group">
                <label>Email Address *</label>
                <input
                  className="input-field"
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  className="input-field"
                  type="number" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XX XXXXXX"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Message *</label>
              <textarea
                className="input-field"
                rows="5" required value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" className="submit-btn">
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>

        <div className="glass-card" data-aos="fade-up" style={{ height: 'fit-content' }}>
          <h3 className="section-title">Contact Information</h3>

          <div className="info-item">
            <div className="icon-box"><MapPin size={22} /></div>
            <div className="info-content">
              <h5>Location</h5>
              <p>{details.address || "Fetching address..."}</p>
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box"><Mail size={22} /></div>
            <div className="info-content">
              <h5>Email Address</h5>
              <p>{details.email || "Fetching email..."}</p>
            </div>
          </div>

          <div className="info-item">
            <div className="icon-box"><Phone size={22} /></div>
            <div className="info-content">
              <h5>Phone Support</h5>
              <p>{details.phone || "Fetching phone..."}</p>
            </div>
          </div>

          <div className="map-container">
            <div className="map-header">
              <MapPin size={18} />
              <span>National Polytechnic Institute (NPI) — Main Campus, Dhaka</span>
            </div>
            <div className="map-wrapper">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.7242775100117!2d90.39030597479217!3d23.757209788515933!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b898a8dcc869%3A0x587d77b06c1f048!2sNational%20Polytechnic%20Institute%2C%20Dhaka%20%7C%20Main%20Campus!5e0!3m2!1sen!2sbd!4v1786385935191!5m2!1sen!2sbd"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="National Polytechnic Institute Dhaka - Main Campus Location"
              />
            </div>
            <div className="map-footer">
              <MapPin size={14} />
              <span>House # 27, Road # 11/A, Dhanmondi, Dhaka 1209, Bangladesh</span>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=National+Polytechnic+Institute+Dhaka+Main+Campus"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions →
              </a>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default Contacts;
