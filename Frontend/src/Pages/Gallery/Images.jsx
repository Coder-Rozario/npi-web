import { API_BASE_URL, placeholderImage } from "../../apiConfig";
import { useState, useEffect } from "react";
import { AiOutlineClose, AiOutlineExpandAlt } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Loading from "../../Components/Loading/Loading";
import PropTypes from "prop-types";

const Images = ({ onLoaded, isFullPage = true }) => {
  const [portfolioItems, setPortfolioItems] = useState(() => {
    const cached = sessionStorage.getItem('photos_list');
    try {
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [loading, setLoading] = useState(!sessionStorage.getItem('photos_list'));

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/portfolio`);
        const data = await response.json();
        const formattedData = Array.isArray(data) ? [...data].reverse() : [];
        setPortfolioItems(formattedData);
        sessionStorage.setItem('photos_list', JSON.stringify(formattedData));
        setLoading(false);
        if (typeof onLoaded === "function") onLoaded(formattedData);
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setLoading(false);
        let fallbackData = [];
        if (!sessionStorage.getItem('photos_list')) {
          setPortfolioItems([]);
        } else {
          try {
            fallbackData = JSON.parse(sessionStorage.getItem('photos_list')) || [];
          } catch (_) {}
        }
        if (typeof onLoaded === "function") onLoaded(fallbackData);
      }
    };
    fetchGallery();
  }, [onLoaded]);

  const getImageUrl = (photoPath) => {
    if (!photoPath) return placeholderImage(300);
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;

    const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const handleOpenPopup = (image) => {
    setPopupImage(image);
    setIsPopupOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    document.body.style.overflow = "auto";
  };

  if (!loading && (!Array.isArray(portfolioItems) || portfolioItems.length === 0)) {
    return null;
  }

  return (
    <div className={`${isFullPage ? 'min-h-screen' : ''} bg-[#f8fafc] py-16 px-4`}>
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loading />
          </div>
        ) : (

          <div className="flex flex-wrap justify-center gap-10">
            {Array.isArray(portfolioItems) && portfolioItems.length > 0 && portfolioItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{
                    duration: 0.5,
                    delay: index % 3 * 0.1,
                    type: "spring",
                    stiffness: 100
                }}
                onClick={() => {
                  handleOpenPopup(getImageUrl(item.imgSrc));
                }}

                className="group relative bg-white rounded-[2rem] p-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]
                           hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.2)] hover:-rotate-1 cursor-pointer
                           w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.7rem)]"
              >
                <div className="relative overflow-hidden rounded-[1.5rem] h-80 shadow-inner">
                  <img
                    alt={item.title || "National Polytechnic Institute NPI Dhaka Campus Image Gallery - Best Polytechnic in Bangladesh"}
                    src={getImageUrl(item.imgSrc)}
                    className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                      <AiOutlineExpandAlt className="text-white" size={30} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 pb-4 px-4 text-center">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-1 font-medium italic">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl"
            onClick={handleClosePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              className="relative max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClosePopup}
                className="absolute -top-16 right-0 md:-right-4 bg-white/10 hover:bg-red-500 text-white p-3 rounded-full transition-all duration-300 border border-white/20"
              >
                <AiOutlineClose size={28} />
              </button>

              <img
                src={popupImage}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(3,105,161,0.3)] border-4 border-white/5"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Images.propTypes = {
  onLoaded: PropTypes.func,
  isFullPage: PropTypes.bool,
};

export default Images;
