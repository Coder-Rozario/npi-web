import { API_BASE_URL, BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import Typewriter from "typewriter-effect";
import { toast } from "react-toastify";

const defaultIntroCover = "/Images/cover.jpg";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';

const Admin_Intro = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditable, setCurrentEditable] = useState("");
  const [introText, setIntroText] = useState({
    headerEnglish: "",
    headerBengali: "",
    description: "",
    backgroundUrl: "",
    backgroundType: "",
  });
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState("");
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchIntroData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getIntroData?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      setIntroText((prev) => ({
        headerEnglish: data.intro_Eng || prev.headerEnglish,
        headerBengali: data.intro_Ban || prev.headerBengali,
        description: data.subtitle || prev.description,
        backgroundUrl: data.intro_bg_url || prev.backgroundUrl,
        backgroundType: data.intro_bg_type || prev.backgroundType,
      }));
      if (data.intro_bg_url) {
        setBackgroundPreviewUrl(data.intro_bg_url);
      }
    } catch (error) {
      console.error("Error fetching intro data:", error);
    }
  };

  useEffect(() => {
    fetchIntroData();
  }, []);

  const openModal = (field) => {
    setCurrentEditable(field);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const getMediaUrl = (path) => {
    if (!path) return "";
    const normalized = path
      .replace(/\\/g, '/')
      .replace(/^\/?api\//, '')
      .replace(/^\//, '');
    if (normalized.startsWith('http')) return normalized;
    return `${API_BASE_URL}/${normalized}`;
  };

  const getCurrentBackgroundSrc = () => {
    if (backgroundFile) return backgroundPreviewUrl;
    if (introText.backgroundUrl) return getMediaUrl(introText.backgroundUrl);
    return defaultIntroCover;
  };

  const isCurrentBackgroundVideo = () => {
    if (backgroundFile) return backgroundFile.type.startsWith('video/');
    return introText.backgroundType === 'video';
  };

  const handleUploadBackground = async () => {
    if (!backgroundFile) {
      toast.error('Please select a photo or video first.');
      return;
    }
    setUploadingBackground(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('background', backgroundFile);
      const token = localStorage.getItem('authToken');

      const response = await axios.post(`${API_BASE_URL}/uploadIntroBackground`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
        timeout: 0,
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success('Background uploaded successfully!');
        setBackgroundFile(null);
        setBackgroundPreviewUrl("");
        setUploadProgress(100);
        setIsUploadPopupOpen(false);
        // refresh intro data to show new background
        await fetchIntroData();
      } else {
        throw new Error(response.data && response.data.error ? response.data.error : 'Upload failed');
      }
    } catch (error) {
      console.error('Background upload failed:', error);
      toast.error(error.response?.data?.error || error.message || 'Error uploading background');
    } finally {
      setUploadingBackground(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  const handleBackgroundChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setBackgroundFile(file);
    setBackgroundPreviewUrl(previewUrl);
    setIsUploadPopupOpen(true);
  };

  const closeUploadPopup = () => {
    setIsUploadPopupOpen(false);
    setBackgroundFile(null);
    setBackgroundPreviewUrl("");
    setUploadProgress(0);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await authFetch(`${API_BASE_URL}/updateIntroData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intro_Eng: introText.headerEnglish,
          intro_Ban: introText.headerBengali,
          subtitle: introText.description,
        }),
      });
      const data = await response.json();
      if (data.message) {
        toast.success("Content updated successfully!");
        closeModal();
      }
    } catch (error) {
      console.error('Saving intro data failed:', error);
      toast.error("Error saving data");
    }
  };

  const strings = [introText.headerEnglish, introText.headerBengali].filter(Boolean);

  return (
    <div className="relative">
      <style>{`
        .all_intro {
          height: 85vh;
          width: 100%;
          overflow: hidden;
          position: relative;
          background: #000;
        }

        .bg_video {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          min-width: 100%; min-height: 100%;
          object-fit: cover;
          z-index: 1;
        }

        .hero_content {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(
            135deg,
            rgba(3, 9, 12, 0.85) 0%,
            rgba(1, 134, 192, 0.2) 100%
          );
          backdrop-filter: blur(4px);
          width: 100%;
          height: 100%;
          color: white;
        }

        .hero_content::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
          pointer-events: none;
        }

        .intro_header {
          font-size: clamp(1.8rem, 5vw, 3.5rem);
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 15px;
          border-radius: 12px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          letter-spacing: -0.5px;
          border: 2px dashed transparent;
        }

        .intro_header:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-3px);
        }

        .intro_des {
          margin-top: 2vh;
          font-size: clamp(1rem, 2vw, 1.4rem);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 10px 20px;
          border-radius: 10px;
          max-width: 800px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.9;
          border: 2px dashed transparent;
        }

        .intro_des:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          opacity: 1;
        }

        .glass-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 500px;
          padding: 0;
          z-index: 101;
          overflow: hidden;
        }

        .modal-header {
          background: linear-gradient(90deg, #0186C0, #005a82);
          padding: 15px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .modern-input {
          width: 100%;
          padding: 12px 15px;
          background: white;
          border: 1px solid #0186C0;
          border-radius: 10px;
          font-size: 1rem;
          color: black;
          transition: all 0.2s;
          outline: none;
        }

        .modern-input:focus {
          border-color: #005a82;
          box-shadow: 0 0 0 3px rgba(1, 134, 192, 0.1);
        }

        .btn-save {
          background: #0187c0;
          color: white;
          padding: 12px 25px;
          border-radius: 10px;
          font-weight: 600;
          transition: 0.2s;
        }

        .btn-save:hover {
          background: #016a96;
          transform: translateY(-1px);
        }

        @media (max-width: 1024px) {
          .all_intro { height: 70vh; }
          .hero_content { padding: 40px 20px; }
          .intro_header { font-size: 2.2rem !important; }
          .intro_des { font-size: 1rem; margin-top: 2vh; }
        }

        @media (max-width: 480px) {
          .all_intro { height: 60vh; min-height: 450px; }
          .hero_content { padding: 30px 15px; }
          .intro_header { font-size: 1.8rem !important; line-height: 1.2; }
          .intro_des {
            margin-top: 2vh;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
          }
        }
      `}</style>

      <div className="all_intro">
        {isCurrentBackgroundVideo() ? (
          <video className="bg_video" src={getCurrentBackgroundSrc()} autoPlay loop muted playsInline />
        ) : (
          <img className="bg_video" src={getCurrentBackgroundSrc()} alt="Intro background" />
        )}
        <div className="hero_content">
          <div className="flex flex-col items-center">

            <h1 className="intro_header" onClick={() => openModal("header")}>
              <Typewriter
                key={strings.join("-")}
                options={{
                  strings: strings.length ? strings : ["Enter Title"],
                  autoStart: true,
                  loop: true,
                  delay: 40,
                  deleteSpeed: 20,
                }}
              />
            </h1>

            <p className="intro_des" onClick={() => openModal("description")}>
              {introText.description || "Click here to add a subtitle description"}
            </p>
            <div className="mt-6 space-y-4 w-full max-w-xl mx-auto">
              <label className="text-xs uppercase tracking-widest text-white/70">Intro background</label>
              <div className="flex flex-col items-center gap-3">
                <input id="intro-bg-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleBackgroundChange} />
                <label htmlFor="intro-bg-upload" className="cursor-pointer rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/15">
                  Select photo or video
                </label>
                {backgroundFile && (
                  <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 px-4 py-8 text-center text-white/80">
                    <p className="mb-2 text-sm">Preview and upload will appear in a popup.</p>
                    <button type="button" onClick={() => setIsUploadPopupOpen(true)} className="btn-save">
                      Open upload popup
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 text-white/50 text-sm italic">
              * Click on text to edit content
            </div>
          </div>
        </div>
      </div>

      {isUploadPopupOpen && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[110] p-6 backdrop-blur-sm">
          <div className="glass-modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Preview selected background</h2>
              <button onClick={closeUploadPopup} className="text-2xl hover:text-red-200 transition-colors">
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
                {backgroundFile?.type.startsWith("video/") ? (
                  <video src={backgroundPreviewUrl} controls className="w-full h-auto object-cover" />
                ) : (
                  <img src={backgroundPreviewUrl} alt="Background preview" className="w-full h-auto object-cover" />
                )}
              </div>
              <div className="flex flex-col gap-4">
                <button type="button" onClick={handleUploadBackground} disabled={uploadingBackground} className="btn-save w-full">
                  {uploadingBackground ? `Uploading... ${uploadProgress}%` : 'Upload background'}
                </button>
                <button type="button" onClick={closeUploadPopup} className="btn-save bg-gray-400 hover:bg-gray-500">
                  Cancel
                </button>
                {uploadingBackground && (
                  <div className="w-full mt-2 h-2 bg-white/20 rounded overflow-hidden">
                    <div style={{ width: `${uploadProgress}%` }} className="h-full bg-teal-500 transition-all" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-6 backdrop-blur-sm">
          <div className="glass-modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">
                Edit {currentEditable === "header" ? "Main Header" : "Subtitle"}
              </h2>
              <button onClick={closeModal} className="text-2xl hover:text-red-200 transition-colors">
                ×
              </button>
            </div>

            <div className="p-6">
              {currentEditable === "header" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ENGLISH TITLE</label>
                    <input
                      type="text"
                      value={introText.headerEnglish}
                      onChange={(e) => setIntroText({ ...introText, headerEnglish: e.target.value })}
                      className="modern-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">BENGALI TITLE</label>
                    <input
                      type="text"
                      value={introText.headerBengali}
                      onChange={(e) => setIntroText({ ...introText, headerBengali: e.target.value })}
                      className="modern-input"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">DESCRIPTION</label>
                  <textarea
                    rows="4"
                    value={introText.description}
                    onChange={(e) => setIntroText({ ...introText, description: e.target.value })}
                    className="modern-input"
                  />
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button onClick={handleSave} className="btn-save shadow-lg w-full">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin_Intro;
