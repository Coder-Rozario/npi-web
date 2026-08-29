import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import altpic from '../../Images/download.png';
import { RiDoubleQuotesL } from "react-icons/ri";
import { FaGraduationCap } from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { useLoadingManager } from "../../Components/Loading/LoadingManager";
import LoadingSpinner from "../../Components/Loading/LoadingSpinner";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const StudentFeedback = () => {
  const [feedbackList, setFeedbackList] = useState(() => {
    try {
      const cached = sessionStorage.getItem('student_feedback');
      const parsed = cached ? JSON.parse(cached) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return [...list].sort((a, b) => {
        const oA = typeof a.order_index === 'number' ? a.order_index : 0;
        const oB = typeof b.order_index === 'number' ? b.order_index : 0;
        if (oA !== oB) return oA - oB;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    } catch (_) {
      return [];
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);
  const [loading, setLoading] = useState(!sessionStorage.getItem('student_feedback'));
  const { markLoaded } = useLoadingManager();

  useAutoRefresh(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-feedback?nocache=1`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();
        const list = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const oA = typeof a.order_index === 'number' ? a.order_index : 0;
              const oB = typeof b.order_index === 'number' ? b.order_index : 0;
              if (oA !== oB) return oA - oB;
              return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            })
          : [];
        setFeedbackList(list);
        if (list.length > 0) {
          sessionStorage.setItem('student_feedback', JSON.stringify(list));
        }
        return list;
      } catch (err) {
        console.error('Student feedback fetch error:', err);
        return feedbackList || [];
      } finally {
        setLoading(false);
        markLoaded("StudentFeedback");
      }
    },
    [],
    { intervalMs: 1200, maxIntervalMs: 6000, timeoutMs: 7000, isReady: (d) => Array.isArray(d) }
  );

  useEffect(() => {
    if (feedbackList.length > 0 && !paused && !expandedFeedbackId) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % feedbackList.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [feedbackList, paused, expandedFeedbackId]);

  const getImageUrl = (photoPath) => {
    if (!photoPath) return altpic;
    const urlRegex = /^(https?:)?\/\//;
    if (urlRegex.test(photoPath) || photoPath.startsWith("data:")) {
      return photoPath;
    }
    const normalized = photoPath.replace(/\\/g, '/');
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/uploads/${cleanPath}`;
    return url;
  };

  const currentFeedback = feedbackList[currentIndex] || {};

  if (!loading && feedbackList.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden relative min-h-[400px]">
      {loading && <LoadingSpinner overlay />}
      <div className="max-w-screen-xl mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">
            What Our <span style={{ color: '#0186C0' }}>Students Say</span>
          </h1>
          <div className="w-20 md:w-24 h-1.5 bg-[#0186C0] mx-auto rounded-full"></div>
        </motion.div>

        <div
          className="relative max-w-4xl mx-auto"
          aria-busy={loading ? "true" : "false"}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            {!loading && feedbackList.length > 0 && currentFeedback.name ? (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="group relative bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem]
                           border border-slate-100 shadow-lg hover:shadow-2xl
                           transition-all duration-500"
              >
                <RiDoubleQuotesL className="absolute top-6 right-6 md:top-8 md:right-10 text-slate-100 text-6xl md:text-8xl pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start relative z-10">

                  <div className="order-first md:order-none flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-32 h-32 md:w-44 md:h-44">
                      <div className="absolute inset-0 bg-[#0186C0] rounded-2xl rotate-0 group-hover:rotate-6 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>

                      <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-md transform transition duration-500 group-hover:-translate-y-1 group-hover:-translate-x-1">
                        <img
                          src={getImageUrl(currentFeedback.photo_path || currentFeedback.photo || currentFeedback.photo_url)}
                          alt={currentFeedback.name || 'Student'}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = altpic; console.error('Feedback image failed, using local fallback:', e.currentTarget.src); }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0186C0]/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex items-end justify-center pb-3">
                          <FaGraduationCap className="text-white text-2xl animate-bounce" />
                        </div>
                      </div>
                    </div>

<div className="mt-4 flex flex-col items-center gap-2">
  {currentFeedback.type === "alumni" ? (
    <div className="border border-[#0186C0] text-[#0186C0] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
      Alumni
    </div>
  ) : (
    currentFeedback.semester && (
      <div className="border border-indigo-500 text-indigo-500 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
        {currentFeedback.semester} Semester
      </div>
    )
  )}
</div>
                  </div>

                  <div className="order-last md:order-none flex-1 text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 transition">
                      {currentFeedback.name}
                    </h3>

                    <div className="flex items-center justify-center md:justify-start mb-4">
                      <span className="text-[#0186C0] font-semibold text-xs md:text-sm uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                        {currentFeedback.department}
                      </span>
                    </div>

                    <p className={`text-slate-600 leading-relaxed text-sm md:text-base italic px-4 md:pl-4 md:pr-0 border-blue-200 md:border-l-4 group-hover:border-[#0186C0] transition-all duration-300
                    ${expandedFeedbackId === currentFeedback.id ? "" : "line-clamp-4"}`}>
                      &ldquo;{currentFeedback.message}&rdquo;
                    </p>

                    {currentFeedback.message && currentFeedback.message.length > 180 && (
                      <button
                        onClick={() => setExpandedFeedbackId(expandedFeedbackId ? null : currentFeedback.id)}
                        className="mt-3 text-blue-600 font-semibold hover:text-indigo-700 text-sm underline underline-offset-4"
                      >
                        {expandedFeedbackId ? "Show Less" : "Read Full Story"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : !loading && feedbackList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm"
              >
                <RiDoubleQuotesL className="text-slate-100 text-6xl mb-4" />
                <p className="text-slate-400 font-medium italic">No feedback yet.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex justify-center mt-8 md:mt-12 space-x-3">
            {feedbackList.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setPaused(true);
                  setTimeout(() => setPaused(false), 5000);
                }}
                className={`transition-all duration-500 rounded-full ${
                  index === currentIndex
                    ? "w-8 md:w-10 h-2 md:h-3 bg-[#0186C0]"
                    : "w-2 md:w-3 h-2 md:h-3 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <Link
            to="/Student_Feedback_Form"
            className="inline-flex items-center gap-3 text-slate-900 font-bold text-sm border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-all group"
          >
            Submit Your Feedback
            <HiOutlineArrowNarrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default StudentFeedback;
