import { API_BASE_URL } from "../../apiConfig";
import { useRef, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import { motion } from "framer-motion";

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchPhotos = () => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/photos?t=${new Date().getTime()}`)
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setPhotos(data);
        } else {
          console.error('Unexpected photos data format:', data);
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

  const getImageUrl = (photo) => {
    if (photo.url.startsWith("http")) return photo.url;
    return `${API_BASE_URL}/${photo.url.replace(/\\/g, '/')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    },
    hover: {
      y: -10,
      boxShadow: "0 30px 60px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3 },
    },
  };

  const styles = {
    wrapper: {
      background: "radial-gradient(circle at top, #eff8ff 0%, #ffffff 45%, #f8fafc 100%)",
      minHeight: "100vh",
      padding: "10px 18px 120px",
    },
    container: {
      maxWidth: "1240px",
      margin: "0 auto",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
    },
    title: {
      fontSize: "3.2rem",
      fontWeight: "900",
      color: "#065f9f",
      marginBottom: "12px",
      letterSpacing: "-0.6px",
    },
    subtitle: {
      fontSize: "1rem",
      color: "#475569",
      fontWeight: "500",
      maxWidth: "720px",
      margin: "0 auto",
      lineHeight: "1.8",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "28px",
      padding: "26px 0",
    },
    card: {
      position: "relative",
      borderRadius: "32px",
      overflow: "hidden",
      cursor: "pointer",
      background: "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.95))",
      border: "1px solid rgba(2, 132, 199, 0.12)",
      boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
      transition: "transform 0.35s ease, box-shadow 0.35s ease",
      minHeight: "420px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    cardHovered: {
      transform: "translateY(-8px)",
      boxShadow: "0 30px 70px rgba(15, 23, 42, 0.15)",
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      minHeight: "280px",
      overflow: "hidden",
      background: "#e2e8f0",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.45s ease",
    },
    overlayInfo: {
      position: "absolute",
      inset: 0,
      background: "rgba(2, 132, 199, 0.72)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0,
      transition: "opacity 0.25s ease",
      backdropFilter: "blur(4px)",
    },
    tag: {
      position: "absolute",
      top: "18px",
      left: "18px",
      background: "rgba(255,255,255,0.88)",
      color: "#0f172a",
      padding: "8px 14px",
      borderRadius: "999px",
      fontSize: "0.78rem",
      fontWeight: "700",
      letterSpacing: "0.02em",
      boxShadow: "0 12px 30px rgba(2, 132, 199, 0.16)",
      border: "1px solid rgba(255,255,255,0.6)",
    },
    cardInfo: {
      padding: "24px",
      textAlign: "center",
    },
    photoIndex: {
      fontSize: "0.88rem",
      color: "#0f766e",
      fontWeight: "700",
      marginBottom: "12px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    cardTitle: {
      fontSize: "1.3rem",
      fontWeight: "800",
      color: "#0f172a",
      marginBottom: "10px",
      lineHeight: "1.2",
    },
    cardText: {
      fontSize: "0.96rem",
      color: "#475569",
      lineHeight: "1.75",
      minHeight: "52px",
    },
    emptyState: {
      textAlign: "center",
      padding: "90px 20px",
      color: "#64748b",
    },
    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.92)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "24px",
    },
    modalImage: {
      maxWidth: "94vw",
      maxHeight: "86vh",
      objectFit: "contain",
      borderRadius: "22px",
      boxShadow: "0 30px 90px rgba(15, 23, 42, 0.45)",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    closeBtn: {
      position: "absolute",
      top: "24px",
      right: "24px",
      background: "rgba(15, 23, 42, 0.3)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "50%",
      width: "52px",
      height: "52px",
      cursor: "pointer",
      fontSize: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.25s ease",
    },
    navBtn: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      background: "rgba(255, 255, 255, 0.18)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.35)",
      borderRadius: "50%",
      width: "56px",
      height: "56px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.25s ease",
      fontSize: "24px",
      backdropFilter: "blur(8px)",
    },
    viewBtn: {
      background: "rgba(255,255,255,0.95)",
      color: "#0f172a",
      border: "none",
      padding: "10px 20px",
      borderRadius: "999px",
      fontWeight: "700",
      fontSize: "0.9rem",
      cursor: "pointer",
    },
  };

  const handleCardHover = (e, hover) => {
    if (e.currentTarget.querySelector('[data-overlay]')) {
      e.currentTarget.querySelector('[data-overlay]').style.opacity = hover ? "1" : "0";
    }
    if (e.currentTarget.querySelector('[data-image]')) {
      e.currentTarget.querySelector('[data-image]').style.transform = hover ? "scale(1.08)" : "scale(1)";
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    }
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Photo Gallery</h1>
          <p style={styles.subtitle}>Explore beautiful moments from our campus</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="inline-block">
              <div style={{
                width: "50px",
                height: "50px",
                border: "4px solid #e0e0e0",
                borderTop: "4px solid #0186C0",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}></div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
            <p style={{ marginTop: "20px", color: "#666" }}>Loading photos...</p>
          </div>
        ) : photos.length > 0 ? (
          // FIX: replaced `whileInView` (which relies on IntersectionObserver
          // and on some mobile browsers doesn't fire correctly until the
          // user scrolls / a resize/scroll event recalculates it) with
          // `animate="visible"`. This makes the grid animate in as soon as
          // it mounts, regardless of scroll position or viewport size.
          <motion.div
            style={styles.grid}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                style={styles.card}
                variants={cardVariants}
                whileHover="hover"
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div style={styles.imageContainer}>
                  <span style={styles.tag}>{photo.title ? photo.title : "Campus Moment"}</span>
                  <img
                    data-image
                    src={getImageUrl(photo)}
                    alt={photo.title ? photo.title : `Gallery photo ${index + 1}`}
                    style={styles.image}
                    loading="lazy"
                  />
                  <div
                    data-overlay
                    style={styles.overlayInfo}
                  >
                    <button style={styles.viewBtn}>
                      View Full Size
                    </button>
                  </div>
                </div>
                <div style={styles.cardInfo}>
                  <div style={styles.photoIndex}>Photo #{index + 1}</div>
                  <div style={styles.cardTitle}>{photo.title || "Beautiful campus moment"}</div>
                  <div style={styles.cardText}>
                    {photo.description || "Tap the card to open the full image modal and browse with arrows."}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📷</div>
            <p style={{ fontSize: "1.2rem" }}>No photos available at the moment.</p>
            <p>Please check back later!</p>
          </div>
        )}
      </div>

      {/* Modal for full-size photo view */}
      {selectedPhoto && (
        <motion.div
          style={styles.modal}
          onClick={() => setSelectedPhoto(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            style={styles.closeBtn}
            onClick={() => setSelectedPhoto(null)}
            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          >
            ×
          </button>

          {photos.findIndex(p => p.id === selectedPhoto.id) > 0 && (
            <button
              style={{ ...styles.navBtn, left: "20px" }}
              onClick={handlePrevPhoto}
              onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
            >
              <FaChevronLeft />
            </button>
          )}

          <motion.img
            src={getImageUrl(selectedPhoto)}
            alt="Full size"
            style={styles.modalImage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {photos.findIndex(p => p.id === selectedPhoto.id) < photos.length - 1 && (
            <button
              style={{ ...styles.navBtn, right: "20px" }}
              onClick={handleNextPhoto}
              onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
            >
              <FaChevronRight />
            </button>
          )}

          <div style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            fontSize: "0.95rem",
            fontWeight: "600",
          }}>
            {photos.findIndex(p => p.id === selectedPhoto.id) + 1} / {photos.length}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PhotoGallery;