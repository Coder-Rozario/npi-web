import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../Components/Loading/Loading";
import { MdVerified, MdLocationOn, MdBusiness, MdEmail, MdLanguage, MdPhoneInTalk } from 'react-icons/md';
import { FaFacebook, FaLinkedin, FaTwitter, FaYoutube, FaCamera, FaSave } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { motion } from "framer-motion";

const styles = {
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '20px 15px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    position: 'sticky',
    top: '40px'
  },
  imageContainer: {
    margin: '0 auto 30px',
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(3, 105, 161, 0.15)',
    cursor: 'pointer'
  },
  iconBox: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    color: '#0186C0',
    fontSize: '20px',
    transition: 'all 0.3s ease'
  },
  statLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '2px'
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    wordBreak: 'break-word'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)',
    margin: '25px 0'
  }
};

const defaultInfoRows = [
  { icon: <MdBusiness />, label: 'Institution', value: 'National Polytechnic Institute' },
  { icon: <MdLocationOn />, label: 'Location', value: 'Loading...' },
  { icon: <MdEmail />, label: 'Email Address', value: 'Loading...' },
  { icon: <MdPhoneInTalk />, label: 'Contact', value: 'Loading...' },
  { icon: <MdLanguage />, label: 'Official Portal', value: 'www.npi.edu.bd' }
];

const defaultSocialLinks = [
  { icon: <FaFacebook />, link: '', color: '#1877F2' },
  { icon: <FaLinkedin />, link: '', color: '#0A66C2' },
  { icon: <FaTwitter />, link: '', color: '#1DA1F2' },
  { icon: <FaYoutube />, link: '', color: '#FF0000' }
];

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 group">
      <div style={styles.iconBox} className="group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200">
        {icon}
      </div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <p style={styles.statValue}>{value}</p>
      </div>
    </div>
  );
}

const AdminAboutLayout = ({ apiUrl, title = 'NPI Dhaka', subtitle }) => {
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [dbRows, setDbRows] = useState(defaultInfoRows);
  const [dbSocials, setDbSocials] = useState(defaultSocialLinks);

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/storage/photos/shares/15451150562222_copy.jpg";
    if (photoPath.startsWith("http") || photoPath.startsWith("data:") || photoPath.startsWith("blob:")) return photoPath;
    return `${API_BASE_URL}/${photoPath.replace(/\\/g, '/')}?t=${imageVersion}`;
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${apiUrl}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (data) {
        setContent(data.content || "");
        setPhoto(getImageUrl(data.photo));
        setImageVersion(Date.now());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/contact?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setDbRows([
            { icon: <MdBusiness />, label: 'Institution', value: 'National Polytechnic Institute' },
            { icon: <MdLocationOn />, label: 'Location', value: data.address || '' },
            { icon: <MdEmail />, label: 'Email Address', value: data.email || '' },
            { icon: <MdPhoneInTalk />, label: 'Contact', value: data.phone || '' },
            { icon: <MdLanguage />, label: 'Official Portal', value: 'www.npi.edu.bd' }
          ]);
        }
      } catch {}
    };

    const fetchSocial = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get-web-data?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          setDbSocials([
            { icon: <FaFacebook />, link: d.facebookLink || '', color: '#1877F2' },
            { icon: <FaLinkedin />, link: d.linkedinLink || '', color: '#0A66C2' },
            { icon: <FaTwitter />, link: d.twitterLink || '', color: '#1DA1F2' },
            { icon: <FaYoutube />, link: d.youtubeLink || '', color: '#FF0000' }
          ].filter(s => !!s.link));
        }
      } catch {}
    };

    fetchData();
    fetchContact();
    fetchSocial();
  }, [apiUrl]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("photo", file);

    try {
      const response = await authFetch(`${API_BASE_URL}${apiUrl}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        toast.success("Updated successfully!");
      } else {
        toast.error("Error saving data");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error saving data");
    }
  };

  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPhoto(URL.createObjectURL(selectedFile));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-[380px]">
            <div style={styles.sidebarCard}>
              <div style={styles.imageContainer} onClick={() => document.getElementById("photoInput").click()} className="group">
                <img src={photo} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 text-white">
                      <FaCamera size={24} />
                   </div>
                </div>
                <input id="photoInput" type="file" className="hidden" onChange={handlePhotoChange} />
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                  {title} <MdVerified className="text-blue-500" />
                </h2>
                {subtitle && <p className="text-blue-600 font-semibold text-xs mt-1 tracking-wider uppercase">{subtitle}</p>}
              </div>
              <div style={styles.divider}></div>
              <div className="space-y-5">
                {dbRows.map((r, idx) => <InfoRow key={idx} icon={r.icon} label={r.label} value={r.value} />)}
              </div>
            </div>
          </div>

          
          <div className="flex-1">
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
              <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Content Editor</h3>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                       HTML Supported Professional Editor
                    </p>
                 </div>
                 <button 
                    onClick={handleSave} 
                    className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_10px_20px_rgba(3,105,161,0.2)] hover:shadow-[0_15px_30px_rgba(3,105,161,0.3)] hover:-translate-y-1"
                 >
                    <FaSave className="text-xl group-hover:rotate-12 transition-transform" /> 
                    <span>Save Changes</span>
                 </button>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-50 rounded-[2.5rem] p-4 border border-slate-200/60 shadow-inner">
                  <div className="flex items-center gap-4 mb-4 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/30"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/30"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/30"></div>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Editor Console</span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[600px] p-8 bg-transparent border-none focus:ring-0 font-mono text-[15px] leading-relaxed text-slate-700 resize-none placeholder-slate-300"
                    placeholder="<!-- Write your HTML content here -->
<h1>Introduction</h1>
<p>Start typing your content...</p>"
                  />
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                 <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                    <MdVerified size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Professional Formatting Tip</h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium opacity-80">
                       Use standard tags like <b>&lt;h1&gt;</b> for main headings, <b>&lt;p&gt;</b> for paragraphs, and <b>&lt;table&gt;</b> for structured data to maintain a professional look on the client side.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminAboutLayout.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string
};

export default AdminAboutLayout;
