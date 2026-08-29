import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import cover from "../../../Images/Logo.jpg";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admin_overview = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [content, setContent] = useState({
    heading: "Loading...",
    description: "Loading...",
  });
  const [image, setImage] = useState(cover);
  const [imageVersion, setImageVersion] = useState(Date.now());

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/overview?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.length > 0) {
        setContent({
          heading: data[0].ovr_heading,
          description: data[0].ovr_text,
        });
        setImage(data[0].ovr_photo || cover);
        setImageVersion(Date.now());
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
      toast.error("Failed to fetch the overview data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openImageModal = () => setIsImageModalOpen(true);
  const closeImageModal = () => setIsImageModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("photo", file);

      try {
        const response = await authFetch(`${API_BASE_URL}/upload-photo`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.success("Image uploaded successfully!");
          await fetchData();
        } else {
          toast.error("Failed to upload image");
        }
      } catch (error) {
        toast.error("Error uploading image");
      }
    }
    closeImageModal();
  };

  const handleSave = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/overview`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ovr_heading: content.heading,
          ovr_text: content.description,
          ovr_photo: image,
        }),
      });

      if (response.ok) {
        toast.success("Overview updated successfully");
        await fetchData();
        closeModal();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Failed to update the overview");
    }
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath || photoPath === cover) return cover;
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
    return `${API_BASE_URL}/${photoPath.replace(/\\/g, '/')}?t=${imageVersion}`;
  };

  return (
    <section className="ov-section-container relative">
      <style>{`
        .ov-section-container {
          padding: 60px 5%;
          background-color: #ffffff;
          overflow: hidden;
        }

        .ov-flex-layout {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
        }

        .ov-visual-box {
          flex: 1.2;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          order: 1;
          cursor: pointer;
        }

        .ov-frame-deco {
          position: absolute;
          top: -20px; left: -20px;
          width: 140px; height: 120px;
          border-top: 4px solid #0186C0;
          border-left: 4px solid #0186C0;
          border-radius: 15px 0 0 0;
          z-index: 1;
        }

        .ov-badge {
          position: absolute;
          top: -35px; left: 100px; 
          padding: 6px 18px;
          background: #0186C0;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px 6px 6px 0;
          text-transform: uppercase;
          z-index: 5;
        }

        .ov-image-wrapper {
          position: relative;
          width: 100%;
          border-radius: 15px;
          background: #fff;
          padding: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          z-index: 2;
          transition: 0.3s;
        }

        .ov-image-wrapper:hover {
          transform: scale(1.02);
          box-shadow: 0 25px 50px rgba(1, 134, 192, 0.2);
        }

        .main-ov-img {
          width: 100%;
          height: auto;
          border-radius: 10px;
          display: block;
          object-fit: cover;
        }

        .ov-text-box {
          flex: 1;
          order: 2;
          cursor: pointer;
          padding: 15px;
          border-radius: 10px;
          transition: 0.3s;
        }

        .ov-text-box:hover {
          background: rgba(1, 134, 192, 0.05);
        }

        .ov-text-box h1 {
          font-size: clamp(1.5rem, 2.5vw, 2.2rem); 
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 15px;
          color: #0186C0;
        }

        .ov-text-box p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #444;
          text-align: justify;
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .admin-modal-content {
          background: white;
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 550px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }

        .admin-input {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: black;
          outline: none;
        }

        .admin-input:focus {
          border-color: #0186C0;
          background: white;
        }

        @media (max-width: 1024px) {
          .ov-flex-layout { flex-direction: column; gap: 40px; }
          .ov-text-box { order: 1; text-align: center; }
          .ov-text-box h1 { color: #000; font-size: 1.5rem; }
          .ov-visual-box { order: 2; width: 100%; }
          .ov-badge, .ov-frame-deco { display: none !important; }
        }
      `}</style>

      <div className="ov-flex-layout">
        
        <div className="ov-visual-box" onClick={openImageModal}>
          <div className="ov-frame-deco"></div>
          <div className="ov-badge">Edit Overview Image</div>
          <div className="ov-image-wrapper">
            <img src={getImageUrl(image)} className="main-ov-img" alt="Overview" />
          </div>
        </div>

        
        <div className="ov-text-box" onClick={openModal}>
          <h1>{content.heading}</h1>
          <p>{content.description || "Loading information..."}</p>
          <div className="mt-4 text-xs text-blue-500 font-bold italic">
            * Click anywhere on text to edit
          </div>
        </div>
      </div>

      
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Overview Text</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500">HEADING</label>
                <input
                  type="text"
                  name="heading"
                  value={content.heading}
                  onChange={handleInputChange}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">DESCRIPTION</label>
                <textarea
                  name="description"
                  value={content.description}
                  onChange={handleInputChange}
                  className="admin-input"
                  rows="6"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeModal} className="px-6 py-2 text-gray-500 font-semibold">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#0186C0] text-white rounded-lg font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      
      {isImageModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Photo</h2>
            <div className="border-dashed border-2 border-gray-200 p-10 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">📁</span>
                  <span className="text-gray-600 font-medium">Click to choose a new image</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            <button onClick={closeImageModal} className="mt-6 text-gray-400 hover:text-red-500">Close</button>
          </div>
        </div>
      )}

    </section>
  );
};

export default Admin_overview;
