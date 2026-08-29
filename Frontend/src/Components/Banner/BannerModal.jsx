import { useCallback, useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../../apiConfig";

const BANNER_SESSION_KEY = 'npi_banner_modal_seen';

const BannerModal = () => {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [counter, setCounter] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const timerRef = useRef(null);
  const delayRef = useRef(null);
  const closeRef = useRef(null);
  const rotationRef = useRef(null);

  const shouldShowBanner = () => {
    try {
      return sessionStorage.getItem(BANNER_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  };

  const getBannerImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const normalized = imagePath.replace(/\\/g, '/').trim();
    if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:')) return normalized;
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const handleClose = useCallback(() => {
    setShowCard(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rotationRef.current) clearTimeout(rotationRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
    closeRef.current = setTimeout(() => {
      setVisible(false);
    }, 250);
  }, []);

  const scheduleNextBanner = useCallback((currentIndex, list) => {
    if (!list || list.length <= 1) return;
    const currentBanner = list[currentIndex];
    const duration = (currentBanner?.durationSeconds || 5) * 1000;
    rotationRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % list.length;
        setActiveIndex(nextIndex);
        setCounter(list[nextIndex]?.durationSeconds || 5);
        setIsTransitioning(false);
        scheduleNextBanner(nextIndex, list);
      }, 400);
    }, duration);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/banners?nocache=${Date.now()}`)
      .then((r) => r.json())
      .then((list) => {
        if (!mounted) return;
        if (!Array.isArray(list) || list.length === 0) return;

        const activeBanners = list
          .filter((b) => b.active === true || b.active === 1 || b.active === '1')
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return Number(b.id) - Number(a.id);
          })
          .slice(0, 2);

        if (activeBanners.length === 0) return;

        if (!shouldShowBanner()) {
          return;
        }

        try {
          sessionStorage.setItem(BANNER_SESSION_KEY, '1');
        } catch (error) {
          console.warn('Banner session storage unavailable', error);
        }

        setBanners(activeBanners);
        setActiveIndex(0);
        setCounter(activeBanners[0].durationSeconds || 5);

        delayRef.current = window.setTimeout(() => {
          setVisible(true);
        }, 800);
      })
      .catch((err) => { console.warn('Banner modal fetch failed:', err); });

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
      if (closeRef.current) clearTimeout(closeRef.current);
      if (rotationRef.current) clearTimeout(rotationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!visible || banners.length === 0) return;
    delayRef.current = window.setTimeout(() => {
      setShowCard(true);
    }, 50);
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, [visible, banners.length]);

  useEffect(() => {
    if (!visible || banners.length === 0) return;

    timerRef.current = window.setInterval(() => {
      setCounter((c) => {
        if (c <= 1) {
          if (banners.length <= 1) {
            handleClose();
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    scheduleNextBanner(0, banners);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rotationRef.current) clearTimeout(rotationRef.current);
    };
  }, [visible, banners, handleClose, scheduleNextBanner]);

  useEffect(() => {
    if (visible && banners.length > 0) {
      try {
        sessionStorage.setItem(BANNER_SESSION_KEY, '1');
      } catch (e) {
        console.error("Failed to set banner session key:", e);
      }
    }
  }, [visible, banners.length]);

  if (!visible || banners.length === 0) return null;

  const currentBanner = banners[activeIndex];
  const imgSrc = getBannerImageUrl(currentBanner?.image);
  const totalBanners = banners.length;

  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .banner-close-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .banner-close-btn:hover {
          transform: scale(1.15) rotate(90deg);
          background-color: #ef4444 !important;
          color: #ffffff !important;
        }
        .banner-close-btn:active {
          transform: scale(0.95);
        }
        .banner-content-wrapper {
          transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: showCard ? 1 : 0,
          transition: "opacity 0.25s ease-in-out",
        }}
        onClick={handleClose}
      >
        <div
          style={{
            position: "relative",
            maxWidth: "fit-content",
            maxHeight: "90vh",
            background: "transparent",
            opacity: showCard ? 1 : 0,
            transform: showCard ? "scale(1)" : "scale(0.92)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* External Close Button (Image er baire) */}
          <button
            className="banner-close-btn"
            onClick={handleClose}
            aria-label="Close Modal"
            style={{
              position: "absolute",
              right: "-12px",
              top: "-18px",
              zIndex: 20,
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "2px solid #0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "#0f172a",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)",
              fontWeight: "900",
            }}
          >
            ✕
          </button>

          {/* Rotating Banner Content with smooth transition */}
          <div
            className="banner-content-wrapper"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'scale(0.95) translateY(8px)' : 'scale(1) translateY(0)',
            }}
          >
            {/* Banner Image Wrapper */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "transparent",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              }}
            >
              {imgSrc ? (
                <a
                  href={currentBanner.link || "#"}
                  target={currentBanner.link ? "_blank" : "_self"}
                  rel="noreferrer"
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <img
                    src={imgSrc}
                    alt={currentBanner.title || "Banner"}
                    style={{
                      maxWidth: "85vw",
                      maxHeight: "80vh",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "#ffffff",
                    background: "#1e293b",
                    borderRadius: "16px",
                    maxWidth: "400px"
                  }}
                >
                  {currentBanner.title && (
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}>
                      {currentBanner.title}
                    </h3>
                  )}
                  <p style={{ margin: 0, fontSize: "15px", color: "#cbd5e1" }}>
                    {currentBanner.text || "Welcome!"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info Bar: Counter + Indicators */}
          <div
            style={{
              position: "absolute",
              left: "12px",
              right: "12px",
              bottom: "-18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              pointerEvents: "none",
              zIndex: 21,
            }}
          >
            {/* Auto Close Counter Badge */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#38bdf8",
                  display: "inline-block",
                  animation: "pulseGlow 1.5s infinite"
                }}
              />
              {totalBanners > 1 ? `Banner ${activeIndex + 1}/${totalBanners} · Next in ${counter}s` : `Auto close in ${counter}s`}
            </div>

            {/* Pagination Dots (for 2 banners) */}
            {totalBanners > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(15, 23, 42, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {banners.map((_, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: activeIndex === idx ? "22px" : "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: activeIndex === idx ? "#38bdf8" : "rgba(255,255,255,0.3)",
                      transition: "all 0.3s ease",
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BannerModal;
