import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect, useRef } from "react";
import { useLoadingManager } from "../Loading/LoadingManager";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const BottomPhotos = () => {
  const [photos, setPhotos] = useState(() => {
    try {
      const cached = sessionStorage.getItem('photos_list');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);
  const originalLengthRef = useRef(0);
  const scrollInterval = 3500;
  const [loading, setLoading] = useState(!sessionStorage.getItem('photos_list'));
  const { markLoaded } = useLoadingManager();

  useAutoRefresh(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/photos?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const rawData = await response.json();
        const data = Array.isArray(rawData) ? rawData : [];
        originalLengthRef.current = data.length;
        if (data.length > 0) {
          setPhotos([...data, ...data, ...data]);
          sessionStorage.setItem('photos_list', JSON.stringify(data));
        }
        return data;
      } catch (err) {
        console.error('Photos fetch error:', err);
        return [];
      } finally {
        setLoading(false);
        markLoaded("BottomPhotos");
      }
    },
    [],
    { intervalMs: 1200, maxIntervalMs: 6000, timeoutMs: 7000, isReady: (data) => Array.isArray(data) }
  );

  useEffect(() => {
    if (carouselRef.current && originalLengthRef.current > 0) {
      const startLeft = carouselRef.current.clientWidth * originalLengthRef.current;
      carouselRef.current.scrollTo({ left: startLeft, behavior: "auto" });
    }
  }, [photos]);

  useEffect(() => {
    if (photos.length === 0 || loading || isPaused) return;

    const intervalId = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = carouselRef.current;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          const mid = clientWidth * originalLengthRef.current;
          carouselRef.current.scrollTo({ left: mid, behavior: "auto" });
          setActiveIndex(0);
        } else {
          carouselRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });

          const nextIndex = Math.round((scrollLeft + clientWidth) / clientWidth) % (originalLengthRef.current || 1);
          setActiveIndex(nextIndex);
        }
      }
    }, scrollInterval);
    return () => clearInterval(intervalId);
  }, [photos, loading, isPaused]);

  const handleDotClick = (index) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const targetScroll = (originalLengthRef.current + index) * clientWidth;
      carouselRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      setActiveIndex(index);
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      if (originalLengthRef.current > 0) {
        const index = Math.round(scrollLeft / clientWidth) % originalLengthRef.current;
        setActiveIndex(index);
      }
    }
  };

  const handlePrev = () => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      carouselRef.current.scrollBy({ left: -clientWidth, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      carouselRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
    }
  };

  const styles = {
    wrapper: {
      position: "relative",
      padding: "10px 0",
      background: "linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    carouselContainer: {
      position: "relative",
      width: "100%",
      maxWidth: "1050px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    carousel: {
      display: "flex",
      overflowX: "auto",
      width: "100%",
      gap: "0px",
      scrollSnapType: "x mandatory",
      scrollBehavior: "smooth",
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
      perspective: "1000px",
    },
    imageCard: {
      width: "94%",
      height: "520px",
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      border: "8px solid rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.8s ease",
    },
    indicatorContainer: {
        display: 'flex',
        gap: '8px',
        marginTop: '20px'
    },
    dot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#cbd5e1',
        transition: 'all 0.3s ease'
    },
    arrowBtn: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      color: '#0186C0',
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      border: 'none',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      zIndex: 10,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(5px)',
    },
    prevBtn: {
      left: '10px',
    },
    nextBtn: {
      right: '10px',
    }
  };

  if (!loading && originalLengthRef.current === 0) {
    return null;
  }

  return (
    <div style={styles.wrapper} data-aos="zoom-in" data-aos-duration="1500" aria-busy={loading ? "true" : "false"}>
      {loading && <LoadingSpinner overlay />}

      <style>{`
        .carousel-hide-scrollbar::-webkit-scrollbar { display: none; }
        .image-card:hover { transform: scale(1.02) rotateY(2deg); }
        .image-card:hover img { transform: scale(1.1); }
        .nav-arrow:hover { background-color: #0186C0 !important; color: white !important; transform: translateY(-50%) scale(1.1) !important; }

        @media (max-width: 768px) {
          .image-card { height: 340px !important; width: 96% !important; }
        }
      `}</style>

      <div style={styles.carouselContainer} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div 
          ref={carouselRef}
          style={styles.carousel}
          className="carousel-hide-scrollbar"
          onScroll={handleScroll}
        >
          {photos.map((photo, index) => (
            <div key={index} style={styles.carouselItem}>
              <div className="image-card" style={styles.imageCard}>
                <img 
                  src={(photo.photo_path || photo.url || "").startsWith("http") ? (photo.photo_path || photo.url) : `${API_BASE_URL}/uploads/${(photo.photo_path || photo.url || "").replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '')}`}
                  alt={`NPI Dhaka Gallery Image ${index}`} 
                  style={styles.image} 
                />
              </div>
            </div>
          ))}
        </div>

        <button className="nav-arrow" style={{...styles.arrowBtn, ...styles.prevBtn}} onClick={handlePrev}><FaChevronLeft /></button>
        <button className="nav-arrow" style={{...styles.arrowBtn, ...styles.nextBtn}} onClick={handleNext}><FaChevronRight /></button>
      </div>

      <div style={styles.indicatorContainer}>
        {Array.from({ length: originalLengthRef.current }).map((_, index) => (
          <div
            key={index}
            onClick={() => handleDotClick(index)}
            style={{
              ...styles.dot,
              backgroundColor: activeIndex === index ? "#0186C0" : "#cbd5e1",
              width: activeIndex === index ? "25px" : "10px",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomPhotos;
