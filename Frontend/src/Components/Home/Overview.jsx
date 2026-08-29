import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import cover from "../../Images/Logo.jpg";
import axios from "axios";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { useLoadingManager } from "../Loading/LoadingManager";
import { motion } from "framer-motion";

const Overview = () => {
  const [content, setContent] = useState(() => {
    try {
      const cached = sessionStorage.getItem('overview_data');
      if (cached) {
        const data = JSON.parse(cached);
        return {
          heading: data?.[0]?.ovr_heading || "Welcome To National Polytechnic Institute, Dhaka",
          description: data?.[0]?.ovr_text || "",
          image: data?.[0]?.ovr_photo || cover,
        };
      }
    } catch (_) {}
    return {
      heading: "Welcome To National Polytechnic Institute, Dhaka",
      description: "",
      image: cover,
    };
  });
  const [loading, setLoading] = useState(!sessionStorage.getItem('overview_data'));
  const { markLoaded } = useLoadingManager();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/overview`);
        const data = response.data;

        if (data && data.length > 0) {
          setContent({
            heading: data[0].ovr_heading,
            description: data[0].ovr_text,
            image: data[0].ovr_photo || cover,
          });
          sessionStorage.setItem('overview_data', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        markLoaded("Overview");
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (photoPath) => {
    if (!photoPath || photoPath === cover) return cover;
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
    return `${API_BASE_URL}/${photoPath.replace(/\\/g, '/')}`;
  };

  return (
    <section className="ov-section-container relative">
      {loading && <LoadingSpinner overlay />}
      <style>{`
        .ov-section-container {
          padding: 40px 5%;
          background-color: #ffffff;
          top: 5vh;
          overflow: hidden;
        }

        .ov-flex-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }

        .ov-visual-box {
          flex: 1.2;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          order: 1;
        }

        .ov-frame-deco {
          position: absolute;
          top: -20px;
          left: -20px;
          width: 140px;
          height: 120px;
          border-top: 4px solid #0186C0;
          border-left: 4px solid #0186C0;
          border-radius: 15px 0 0 0;
          z-index: 1;
        }

        .ov-badge {
          position: absolute;
          top: -35px;
          left: 100px;
          padding: 6px 18px;
          background: #0186C0;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px 6px 6px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          z-index: 5;
          box-shadow: 0 4px 12px rgba(1, 134, 192, 0.2);
        }

        .ov-image-wrapper {
          position: relative;
          width: 100%;
          border-radius: 15px;
          background: #fff;
          padding: 8px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          z-index: 2;
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
        }

        .ov-text-box h1 {
          font-size: clamp(1.2rem, 2vw, 1.8rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 12px;
          color: #0186C0;
        }

        .ov-text-box p {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #444;
          text-align: justify;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .ov-text-box p::-webkit-scrollbar { width: 4px; }
        .ov-text-box p::-webkit-scrollbar-thumb {
          background: #0186C0;
          border-radius: 10px;
        }

        @media (max-width: 1024px) {
          .ov-section-container { padding: 40px 20px; top: 0; margin-top: 30px; }

          .ov-flex-layout {
            flex-direction: column;
            gap: 0px;
          }

          .ov-visual-box {
            order: 1;
            width: 100%;
            margin-top: 0;
            margin-bottom: 25px;
          }

          .ov-text-box {
            order: 2;
            text-align: center;
            width: 100%;
          }

          .ov-text-box h2 {
            color: #0f172a;
            font-size: 1.5rem;
            margin-bottom: 25px;
            font-weight: 800;
            display: block;
            overflow: hidden;
          }
          .ov-text-box h2 span.text-\[\#0186C0\] {
            color: #0186C0 !important;
          }

          .ov-text-box p {
            text-align: center;
            max-height: none;
            padding-right: 0;
            font-size: 1rem;
            line-height: 1.6;
            color: #334155;
          }

          .ov-badge, .ov-frame-deco {
            display: none !important;
          }

          .ov-image-wrapper {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          }
        }

        @media (max-width: 480px) {
          .ov-section-container { padding: 25px 15px; margin-top: 40px; }
          .ov-text-box h1 { font-size: 1.35rem; margin-bottom: 15px; }
          .ov-text-box p { font-size: 0.92rem; }
        }
      `}</style>

      <div className="ov-flex-layout">

        <div className="ov-visual-box" data-aos="fade-up">
          <div className="ov-frame-deco"></div>
          <div className="ov-badge">Institute Overview</div>
          <div className="ov-image-wrapper">
            <img
              src={getImageUrl(content.image)}
              alt="National Polytechnic Institute Dhaka Campus - Best Polytechnic in Bangladesh"
              className="main-ov-img"
              loading="lazy"
              onError={(e) => (e.target.src = cover)}
            />
          </div>
        </div>

        <div className="ov-text-box" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight">
            <motion.span
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-block mr-2"
            >
              Welcome To
            </motion.span>
            <motion.span
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true }}
              className="text-[#0186C0] inline-block"
            >
              {content.heading.replace("Welcome To ", "")}
            </motion.span>
          </h2>
          <p>{content.description || "Loading information..."}</p>
        </div>
      </div>
    </section>
  );
};

export default Overview;
