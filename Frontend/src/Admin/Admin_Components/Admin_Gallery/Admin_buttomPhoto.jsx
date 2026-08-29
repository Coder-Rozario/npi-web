import { API_BASE_URL } from "../../../apiConfig";
import { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTimes, FaCloudUploadAlt } from "react-icons/fa";
import axios from "axios";

const Admin_BottomPhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originalLength, setOriginalLength] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);
  const scrollInterval = 3500;


  const scrollToLatestPhoto = () => {
    if (!carouselRef.current || originalLengthRef.current === 0) return;
    const { clientWidth } = carouselRef.current;
    const targetIndex = originalLengthRef.current * 2 - 1;
    carouselRef.current.scrollTo({ left: clientWidth * targetIndex, behavior: "smooth" });
  };

  const fetchPhotos = (showLatest = false) => {
    setLoading(true);

    axios
      .get(`${API_BASE_URL}/photos?t=${new Date().getTime()}`)
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setOriginalLength(data.length);
          setPhotos([...data, ...data, ...data]);
          if (showLatest) {
            setTimeout(scrollToLatestPhoto, 100);
          }
        } else {
          console.error('Unexpected photos data format:', data);
          setOriginalLength(0);
          setPhotos([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching photos:", error);
        toast.error("Error fetching photos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPhotos();
  }, []);


  useEffect(() => {
    if (carouselRef.current && originalLength > 0 && !loading) {

      setTimeout(() => {
        if (carouselRef.current) {
          const { clientWidth } = carouselRef.current;
          const mid = clientWidth * originalLength;
          carouselRef.current.scrollTo({ left: mid, behavior: "auto" });
        }
      }, 100);
    }
  }, [loading, originalLength]);

  useEffect(() => {
    if (photos.length === 0 || loading || isPaused) return;
    
    const intervalId = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = carouselRef.current;
        

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          const mid = clientWidth * originalLength;
          carouselRef.current.scrollTo({ left: mid, behavior: "auto" });
        } else {
          carouselRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
        }
      }
    }, scrollInterval);
    return () => clearInterval(intervalId);
  }, [photos, originalLength, loading, isPaused]);


  const handleAddPhoto = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("photo", file);
      toast.info("Uploading photo...");
      axios
        .post(`${API_BASE_URL}/upload`, formData)
        .then(() => {
          toast.success("Photo added successfully!");
          fetchPhotos();
        })
        .catch(() => toast.error("Error adding photo."));
    }
  };

  const handleDeletePhoto = (id) => {
    toast.info("Deleting photo...");
    axios
      .delete(`${API_BASE_URL}/photos/${id}`)
      .then(() => {
        toast.success("Photo deleted successfully!");
        fetchPhotos(); 
      })
      .catch((err) => {
        console.error("Delete error:", err);
        toast.error("Error deleting photo.");
      });
  };

  const confirmDelete = (id) => {
    toast(({ closeToast }) => (
      <div className="p-2">
        <p className="font-semibold text-gray-800 text-sm">Delete this photo?</p>
        <p className="text-[10px] text-gray-500 mb-3">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => { handleDeletePhoto(id); closeToast(); }}>Delete</button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const handleThumbnailClick = (index) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const targetScroll = (originalLength + index) * clientWidth;
      carouselRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  };


  const styles = {
    wrapper: {
      position: "relative",
      padding: "40px 0",
      background: "linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "600px"
    },
    carouselContainer: {
      position: "relative",
      width: "100%",
      maxWidth: "1100px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    carousel: {
      display: "flex",
      overflowX: "auto",
      width: "100%",
      scrollSnapType: "x mandatory",
      msOverflowStyle: "none",
      scrollbarWidth: "none",
      padding: "20px 0",
    },
    carouselItem: {
      flex: "0 0 100%",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      scrollSnapAlign: "center",
      position: "relative",
    },
    imageCard: {
      position: "relative",
      width: "92%",
      height: "480px",
      borderRadius: "32px",
      overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
      border: "10px solid rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(10px)",
      transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    deleteBtn: {
      position: "absolute",
      top: "25px",
      right: "25px",
      backgroundColor: "#ef4444",
      color: "white",
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      border: "none",
      boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
      zIndex: 10,
      transition: "all 0.3s ease"
    },
    uploadArea: {
        marginTop: '30px',
        textAlign: 'center'
    },
    addBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 28px',
        backgroundColor: '#0186C0',
        color: 'white',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 10px 20px rgba(1, 134, 192, 0.3)',
        transition: 'all 0.3s ease'
    },
    thumbnailContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      padding: '15px',
      width: '95%',
      maxWidth: '1000px',
      overflowX: 'auto',
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '24px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
      scrollbarWidth: 'thin',
      scrollbarColor: '#0186C0 rgba(0,0,0,0.05)'
    },
    thumbnailItem: {
      width: '90px',
      height: '60px',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '3px solid transparent',
      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        .carousel-hide-scrollbar::-webkit-scrollbar { display: none; }
        
        .modern-scrollbar {
          justify-content: ${originalLength >= 10 ? 'flex-start' : 'center'} !important;
        }
        
        .modern-scrollbar::-webkit-scrollbar {
          height: 6px;
          display: ${originalLength >= 10 ? 'block' : 'none'};
        }
        
        .modern-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          margin: 0 20px;
        }
        
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: #0186C0;
          border-radius: 10px;
          transition: 0.3s;
        }
        
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0369A1;
        }

        .image-card:hover { transform: scale(1.02); }
        .delete-btn:hover { transform: scale(1.1); background-color: #dc2626 !important; }
        .add-btn:hover { background-color: #0369A1 !important; transform: translateY(-3px); }
        .thumbnail-item:hover { transform: scale(1.1) translateY(-5px); border-color: #0186C0 !important; box-shadow: 0 10px 20px rgba(1, 134, 192, 0.2); }
        
        @media (max-width: 768px) {
          .image-card { height: 320px !important; width: 95% !important; }
          .modern-scrollbar { justify-content: flex-start !important; }
          .modern-scrollbar::-webkit-scrollbar { display: block; }
        }
      `}</style>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Bottom Carousel Management</h2>
        <p className="text-gray-500">Preview and manage images in the bottom infinite slider</p>
      </div>

      <div style={styles.carouselContainer}>
        <div 
          className="carousel-hide-scrollbar" 
          style={styles.carousel} 
          ref={carouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {photos.length > 0 ? photos.map((photo, index) => (
            <div key={`${photo.id}-${index}`} style={styles.carouselItem}>
              <div className="image-card" style={styles.imageCard}>
                <img
                  src={photo.url.startsWith("http") ? photo.url : `${API_BASE_URL}/${photo.url.replace(/\\/g, '/')}`}
                  alt={`Gallery ${index}`}
                  style={styles.image}
                  loading="lazy"
                />
                <button
                  className="delete-btn"
                  style={styles.deleteBtn}
                  onClick={() => confirmDelete(photo.id)}
                  title="Delete this photo"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="h-64 flex items-center justify-center text-gray-400 italic">
                No photos found in gallery.
            </div>
          )}
        </div>
      </div>

      
      {photos.length > 0 && originalLength > 0 && (
        <div style={styles.thumbnailContainer} className="modern-scrollbar">
          {photos.slice(0, originalLength).map((photo, index) => (
            <div 
              key={`${photo.id}-${index}`} 
              style={styles.thumbnailItem}
              onClick={() => handleThumbnailClick(index)}
              className="thumbnail-item"
              title={`View slide ${index + 1}`}
            >
              <img
                src={photo.url.startsWith("http") ? photo.url : `${API_BASE_URL}/${photo.url.replace(/\\/g, '/')}`}
                alt={`Thumbnail ${index}`}
                style={styles.thumbnailImage}
              />
            </div>
          ))}
        </div>
      )}

      <div style={styles.uploadArea}>
        <label htmlFor="add-photo-input" className="add-btn" style={styles.addBtn}>
          <FaCloudUploadAlt size={22} /> Add New Slide Photo
        </label>
        <input 
          type="file" 
          id="add-photo-input" 
          className="hidden" 
          accept="image/*" 
          onChange={handleAddPhoto} 
        />
        <p className="text-xs text-gray-400 mt-3 font-medium uppercase tracking-wider">
            Recomended size: 1920x1080px (Aspect Ratio 16:9)
        </p>
      </div>
    </div>
  );
};

export default Admin_BottomPhotos;
