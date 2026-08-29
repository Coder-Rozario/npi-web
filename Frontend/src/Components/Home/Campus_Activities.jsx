import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from "../../apiConfig";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlay, HiX } from 'react-icons/hi';
import LoadingSpinner from '../Loading/LoadingSpinner';
import { useLoadingManager } from '../Loading/LoadingManager';

const Campus_Activities = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { markLoaded } = useLoadingManager();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/videos`);
        console.log('Campus_Activities: fetched videos', response.data);
        setVideos(response.data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
        markLoaded("Campus");
      }
    };
    fetchVideos();
  }, []);

  const handleMouseEnter = (e) => {
    e.target.play().catch(err => console.log("Autoplay blocked"));
  };

  const handleMouseLeave = (e) => {
    e.target.pause();
    e.target.currentTime = 0;
  };

  const getFileUrl = (photoPath) => {
    if (!photoPath) return "";
    const regexProtocol = /^(https?:)?\/\//;
    if (regexProtocol.test(photoPath) || photoPath.startsWith("data:")) {
      return photoPath;
    }
    const normalized = photoPath.replace(/\\/g, '/');
    const cleanPath = normalized.replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');

    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/uploads/${cleanPath}`;
    return url;
  };

  if (!loading && (!Array.isArray(videos) || videos.length === 0)) {
    return null;
  }

  return (
    <div className="bg-[#f8fafc] py-5 px-4 relative min-h-[300px] pb-20">
      {loading && <LoadingSpinner overlay />}
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <motion.h3 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-sm uppercase tracking-[0.3em] mb-3"
            style={{ color: '#0186C0' }}
          >
            Life at Campus
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-extrabold text-slate-900"
          >
            Campus <span style={{ color: '#0186C0' }}>Activities</span>
          </motion.h2>
          <div className="w-20 h-1.5 mx-auto mt-6 rounded-full" style={{ backgroundColor: '#0186C0' }}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <motion.div
              key={video.id || video._id || index}
              initial={{ 
                opacity: 0, 
                y: 50,
                scale: 0.9
              }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                scale: 1
              }}
              viewport={{ 
                once: true,
                margin: "-50px",
                amount: 0.2
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="group"
            >
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 h-full flex flex-col">

                <div 
                  className="relative aspect-video overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <video
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    src={getFileUrl(video.video_url)}
                    onError={(e) => console.error('Video load error:', getFileUrl(video.video_url), e)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                    <motion.div 
                      initial={{ scale: 0.9 }}
                      whileInView={{ scale: 1 }}
                      className="p-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 scale-90 group-hover:scale-100 transition-all opacity-100 group-hover:opacity-0"
                    >
                      <HiOutlinePlay className="text-white text-3xl" />
                    </motion.div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-slate-800 line-clamp-1 mb-4">
                    {video.title}
                  </h2>

                  {!video.video_url && (
                    <div className="text-sm text-red-500">No video URL provided</div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-md">
                      Activities
                    </span>
                    <motion.button 
                      whileHover={{ x: 5 }}
                      onClick={() => setSelectedVideo(video)}
                      className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      Watch Now <HiOutlinePlay />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-4 md:p-10"
            onClick={() => setSelectedVideo(null)}
          >

            <motion.button 
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-6 right-6 text-white hover:rotate-90 transition-transform duration-300 z-10"
              onClick={() => setSelectedVideo(null)}
            >
              <HiX size={40} />
            </motion.button>

            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ 
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <video 
                autoPlay 
                controls 
                src={getFileUrl(selectedVideo.video_url)} 
                className="w-full h-full object-contain bg-black"
              />
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
              >
                <h3 className="text-white text-xl font-bold">{selectedVideo.title}</h3>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default Campus_Activities;
