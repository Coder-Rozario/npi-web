import { API_BASE_URL } from "../../apiConfig";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLoadingManager } from "../Loading/LoadingManager";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import LoadingSpinner from "../Loading/LoadingSpinner";

const NoticeMarquee = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { markLoaded } = useLoadingManager();

  useAutoRefresh(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-notices?t=${new Date().getTime()}`, { cache: 'no-store' });
        const data = await response.json();
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
          setNotices(data.slice(0, 10));
        }
        setLoading(false);
        return data;
      } catch (error) {
        console.error("Error fetching notices:", error);
        setLoading(false);
      } finally {
        markLoaded("Notice");
      }
    },
    [],
    { intervalMs: 5000, maxIntervalMs: 10000, timeoutMs: 7000 }
  );

  const marqueeStyle = `
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: inline-flex;
      animation: marquee 60s linear infinite;
    }
    .notice-marquee:hover .animate-marquee {
      animation-play-state: paused;
    }
    .marquee-copy {
      display: inline-flex;
      white-space: nowrap;
    }
    .marquee-copy + .marquee-copy {
      padding-left: 4rem;
    }
  `;

  if (!loading && notices.length === 0) {
    return null;
  }

  const renderNoticeItems = () => (
    <>
      <span className="inline-block">Notice - </span>
      {notices.map((notice, index) => (
        <span key={index} className="inline-block lg:mr-8 mr-3">
          <Link
            to="/notice"
            className=" hover:text-blue-300"
            title={notice.title || (notice.fileUrl || '').split('/').pop()}
          >
            {notice.title || (notice.fileUrl || '').split('/').pop()}
          </Link>{" "}
          {index < notices.length - 1 && (
            <span className="mx-2 text-yellow-400">||</span>
          )}
        </span>
      ))}
    </>
  );

  return (
    <>
      <style>{marqueeStyle}</style>
      <div className="relative min-h-[40px]" role="status" aria-live="polite" aria-busy={loading ? "true" : "false"}>
        {loading && <LoadingSpinner overlay />}
        {!loading && (
          <div className="notice-marquee overflow-hidden lg:font-semibold lg:text-lg text-sm bg-gray-800 text-white lg:py-5 py-2">
            <div className="marquee-content animate-marquee">
              <div className="marquee-copy">{renderNoticeItems()}</div>
              <div className="marquee-copy">{renderNoticeItems()}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NoticeMarquee;
