import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import DOMPurify from "dompurify";
import {
  MdOutlineDashboard, MdOutlineSchool, MdTimer,
  MdAccountBalanceWallet, MdPersonOutline, MdVerified, MdLayers
} from "react-icons/md";
import { FaBookOpen, FaArrowRight, FaFacebookMessenger } from "react-icons/fa";
import { Link } from "react-router-dom";
import Loading from "../../Components/Loading/Loading";
import { motion, AnimatePresence } from "framer-motion";

const Architecture_Engineering = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/arcdepartment`);
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchDepartmentData();
  }, []);

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/default-image.jpg";
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;

    const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900 overflow-x-hidden">

      {}
      <div className="relative h-[40vh] lg:h-[70vh] w-full flex items-center lg:items-start lg:pt-16 overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={getImageUrl(data?.hero_image)}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/80 lg:via-slate-900/70 to-transparent"></div>

        <div className="mx-auto lg:w-[75vw] px-6 relative z-10 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto lg:mx-0"
          >
            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full w-fit text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] mb-4 lg:mb-6">
              <MdVerified className="text-blue-400" /> Professional Diploma
            </div>
            <h1 className="text-3xl lg:text-7xl font-black text-white leading-[1.1] mb-4">
              Diploma in <br />
              <span style={{ color: '#0186C0' }}>
                Architecture
              </span> Engineering
            </h1>

          </motion.div>
        </div>
      </div>

      {}
      <div className="mx-auto lg:w-[75vw] px-0 lg:px-6 -mt-10 lg:-mt-24 relative z-20 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">

          {}
          <div className="w-full lg:w-[68%]">
            <div className="bg-white rounded-none lg:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border-b lg:border border-slate-100">

              {}
              <div className="flex p-1 lg:p-2 bg-slate-50/50 border-b border-slate-100">
                {["overview", "curriculum"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex-1 flex items-center justify-center gap-2 lg:gap-3 py-4 lg:py-5 rounded-none lg:rounded-2xl font-bold text-xs lg:text-sm uppercase tracking-wider transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-white shadow-sm lg:shadow-md"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    style={activeTab === tab ? { color: '#0186C0' } : {}}
                  >
                    {tab === "overview" ? <MdOutlineDashboard size={18} /> : <FaBookOpen size={16} />}
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-2 w-6 h-1 rounded-full"
                        style={{ backgroundColor: '#0186C0' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {}
              <div className="p-6 lg:p-14">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-slate max-w-none
                      prose-headings:text-slate-900 prose-headings:font-black
                      prose-p:text-slate-600 prose-p:leading-[1.7] lg:prose-p:leading-[1.8] prose-p:text-base lg:prose-p:text-lg
                      prose-strong:text-blue-600 prose-li:text-slate-600"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(activeTab === "overview" ? data?.overview : data?.curriculum),
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {}
          <div className="w-full lg:w-[32%] space-y-0 md:space-y-8">

            {}
            <div className="bg-slate-900 rounded-none md:rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px]"></div>

              <h3 className="flex flex-col md:flex-row items-center gap-4 text-xl md:text-2xl font-bold mb-8 md:mb-10 text-center md:text-left relative z-10">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/40">
                  <MdLayers size={24} />
                </div>
                Quick Information
              </h3>

              {}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 relative z-10">
                <SidebarItem icon={<MdPersonOutline />} label="Head of Dept." value={data?.chief_instructor} />
                <SidebarItem icon={<MdOutlineSchool />} label="Total Students" value={data?.total_students} />
                <SidebarItem icon={<MdTimer />} label="Course Length" value={data?.duration} />
                <SidebarItem icon={<MdAccountBalanceWallet />} label="Course Fees" value={data?.fees} />
              </div>

              <div className="mt-10 md:mt-12 space-y-4 relative z-10">
                <Link to="/Online_Admission" className="group flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-white hover:text-blue-600 text-white py-5 rounded-xl md:rounded-2xl font-black text-lg transition-all shadow-xl">
                  Apply Now <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link to="/Contacts" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-5 rounded-xl md:rounded-2xl font-bold transition-all">
                  <FaFacebookMessenger /> Get Consultation
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, value }) => (
  <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-5 group text-center md:text-left">
    <div className="p-4 md:p-3.5 bg-white/5 border border-white/10 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
      <div className="scale-125 md:scale-100">{icon}</div>
    </div>
    <div>
      <p className="text-[11px] md:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">{label}</p>
      <p className="text-xl md:text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
        {value || "Not Specified"}
      </p>
    </div>
  </div>
);

export default Architecture_Engineering;

SidebarItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
