import { API_BASE_URL, BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import Typewriter from "typewriter-effect";
import { Link } from "react-router-dom";
import { useLoadingManager } from "../Loading/LoadingManager";

const defaultIntroCover = "/Images/cover.jpg";
import LoadingSpinner from "../Loading/LoadingSpinner";

const Intro = () => {
  const [introText, setIntroText] = useState({
    introEnglish: "National Polytechnic Institute, Dhaka",
    introBengali: "ন্যাশনাল পলিটেকনিক ইনস্টিটিউট, ঢাকা",
    subtitle: "",
  });
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState("");
  const [loading, setLoading] = useState(true);
  const { markLoaded } = useLoadingManager();

  useEffect(() => {
    const fetchIntroData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/getIntroData`);
        const data = await response.json();

        if (data.intro_Eng && data.intro_Ban && data.subtitle) {
          setIntroText({
            introEnglish: data.intro_Eng,
            introBengali: data.intro_Ban,
            subtitle: data.subtitle,
          });
        }
        if (data.intro_bg_type) {
          setBackgroundType(data.intro_bg_type);
        }
        if (data.intro_bg_url) {
          setBackgroundUrl(data.intro_bg_url);
        }
      } catch (error) {
        console.error("Error fetching intro data:", error);
      } finally {
        setLoading(false);
        markLoaded("Intro");
      }
    };

    fetchIntroData();
  }, []);

  const strings = [
    introText.introEnglish,
    introText.introBengali,
  ].filter((s) => typeof s === "string" && s.trim() !== "");

  const getMediaUrl = (path) => {
    if (!path) return "";
    const normalized = path
      .replace(/\\/g, '/')
      .replace(/^\/?api\//, '')
      .replace(/^\//, '');
    if (normalized.startsWith('http')) return normalized;
    return `${API_BASE_URL}/${normalized}`;
  };

  const bgVideoUrl = backgroundType === 'video' && backgroundUrl ? getMediaUrl(backgroundUrl) : null;
  const bgImageUrl = backgroundType === 'photo' && backgroundUrl ? getMediaUrl(backgroundUrl) : null;

  return (
    <div className="relative">
      {loading && <LoadingSpinner overlay />}
      <style>{`
        .all_intro {
          height: 80vh;
          width: 100%;
          overflow: hidden;
          position: relative;
          background: #000;
        }
        .bg_video {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          min-width: 100%;
          min-height: 100%;
          width: 100.5vw;
          height: 100%;
          object-fit: cover;
          margin: 0;
          padding: 0;
          z-index: 1;
          animation: videoFadeIn 1.2s ease-in-out;
        }
        @keyframes videoFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
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
          padding: 8.5vw;
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
          margin-bottom: 2vh;
          color: #fff;
          font-weight: 800;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          letter-spacing: -0.5px;
        }
        .intro_des {
          margin: 0 0 6vh 0;
          font-size: clamp(1rem, 2vw, 1.4rem);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.9;
        }
        .since_container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: -4.5vh 0 6vh 0;
          animation: fadeIn 1.5s ease-out;
        }
        .since_line {
          height: 1px;
          width: 30px;
          background: rgba(255, 255, 255, 0.3);
        }
        .since_text {
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.85; }
        }
        .O_B {
          position: relative;
          background: linear-gradient(90deg, #0186C0, #005a82);
          padding: 16px 45px;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 50px;
          color: white;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 25px rgba(1, 134, 192, 0.4);
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .O_B::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -60%;
          width: 20%;
          height: 200%;
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(30deg);
          transition: all 0.6s ease;
        }
        .O_B:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(1, 134, 192, 0.6);
          background: linear-gradient(90deg, #00a2e8, #0186C0);
        }
        .O_B:hover::after {
          left: 130%;
        }
        @keyframes fadeInSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInSlideUp {
          animation: fadeInSlideUp 1s ease-out;
        }
        @media (max-width: 1024px) {
          .hero_content { padding: 40px 20px; }
          .intro_header { font-size: 2.2rem !important; }
          .intro_des { font-size: 1rem; margin-bottom: 4vh; }
          .O_B { padding: 14px 35px; font-size: 1rem; }
        }
        @media (max-width: 480px) {
          .all_intro { height: calc(100dvh - 45px - 45px); min-height: 450px; }
          .hero_content { padding: 20px 10px; }
          .intro_header {
            font-size: 1.39rem !important;
            line-height: 1.3;
            margin-bottom: 1.5vh;
            width: 100%;
            word-wrap: break-word;
          }
          .intro_des {
            margin-bottom: 3vh;
            font-size: 0.8rem;
            letter-spacing: 0.3px;
          }
          .since_container {
            margin: -2vh 0 3.5vh 0;
            gap: 8px;
            width: 100%;
            justify-content: center;
          }
          .since_text {
            font-size: 0.65rem;
            letter-spacing: 1.5px;
            white-space: nowrap;
          }
          .since_line {
            width: 15px;
            flex-shrink: 0;
          }
          .O_B {
            font-size: 0.85rem;
            padding: 10px 24px;
            letter-spacing: 0.5px;
          }
        }
      `}</style>

      <div className="all_intro">
        {bgVideoUrl ? (
          <video
            className="bg_video"
            src={bgVideoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : bgImageUrl ? (
          <img
            className="bg_video"
            src={bgImageUrl}
            alt="Intro background"
          />
        ) : (
          <img
            className="bg_video"
            src={defaultIntroCover}
            alt="Default intro background"
          />
        )}

        <div className="hero_content">
          <div className="intro_text animate-fadeInSlideUp">
            <h1 className="intro_header">
              <Typewriter
                key={strings.join("|")}
                options={{
                  strings: strings.length ? strings : ["National Polytechnic Institute, Dhaka", "ন্যাশনাল পলিটেকনিক ইনস্টিটিউট, ঢাকা"],
                  autoStart: true,
                  loop: true,
                  delay: 30,
                  deleteSpeed: 10,
                }}
              />
            </h1>
            <p className="intro_des">
              {introText.subtitle || "A Sister Concern of NPI Engineers Ltd."}
            </p>
            <div className="since_container">
              <span className="since_line"></span>
              <span className="since_text">Since-2001</span>
              <span className="since_line"></span>
            </div>
            <Link className="O_B" to="/Online_Admission">
              Online Admission
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
