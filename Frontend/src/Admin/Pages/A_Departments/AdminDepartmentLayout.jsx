import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  MdOutlineDashboard, MdOutlineSchool, MdTimer,
  MdAccountBalanceWallet, MdPersonOutline, MdVerified, MdLayers
} from "react-icons/md";
import { FaBookOpen, FaArrowRight, FaFacebookMessenger, FaCamera, FaSave, FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../../Components/Loading/Loading";

const AdminDepartmentLayout = ({ apiUrl, updateContentUrl, updateCourseUrl, uploadImageUrl, departmentTitle }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [heroImage, setHeroImage] = useState("");
  const [heroImageVersion, setHeroImageVersion] = useState(Date.now());
  const [overviewText, setOverviewText] = useState("");
  const [curriculumText, setCurriculumText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseOverview, setCourseOverview] = useState({
    chiefInstructor: "",
    totalStudents: "",
    duration: "",
    qualification: "",
    fees: "",
  });

  useEffect(() => {
    fetchDepartmentData();
  }, [apiUrl]);

  const fetchDepartmentData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${apiUrl}`);
      const data = response.data;
      setHeroImage(data.hero_image);
      setHeroImageVersion(Date.now());
      setOverviewText(data.overview);
      setCurriculumText(data.curriculum);
      setCourseOverview({
        chiefInstructor: data.chief_instructor,
        totalStudents: data.total_students,
        duration: data.duration,
        qualification: data.qualification,
        fees: data.fees,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleUpdateContent = async () => {
    try {
      await axios.put(`${API_BASE_URL}${updateContentUrl}`, {
        overview: overviewText,
        curriculum: curriculumText,
      });
      toast.success("Content updated successfully!");
      await fetchDepartmentData();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Error updating content");
    }
  };

  const handleUpdateCourseOverview = async () => {
    try {
      await axios.put(`${API_BASE_URL}${updateCourseUrl}`, courseOverview);
      await fetchDepartmentData();
      setIsModalOpen(false);
      toast.success("Course overview updated!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Error updating course overview");
    }
  };

  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("heroImage", file);

      await axios.post(`${API_BASE_URL}${uploadImageUrl}`, formData);
      await fetchDepartmentData();
      setHeroImageVersion(Date.now());
      toast.success("Hero image updated!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading image");
    }
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/default-image.jpg";
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
    const normalized = photoPath.replace(/\\/g, '/');
    return `${API_BASE_URL}/${normalized}?t=${heroImageVersion}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900 overflow-x-hidden">
      <div className="relative h-[40vh] lg:h-[70vh] w-full flex items-center lg:items-start lg:pt-16 overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={getImageUrl(heroImage)}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/80 lg:via-slate-900/70 to-transparent"></div>

        <div className="mx-auto lg:w-[75vw] px-6 relative z-10 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto lg:mx-0">
            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full w-fit text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] mb-4 lg:mb-6">
              <MdVerified className="text-blue-400" /> Professional Diploma
            </div>
            <h1 className="text-3xl lg:text-7xl font-black text-white leading-[1.1] mb-4">
              Diploma in <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {departmentTitle}
              </span> Engineering
            </h1>

            <label htmlFor="imageUpload" className="mt-8 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl w-fit cursor-pointer transition-all group">
              <FaCamera className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Change Hero Image</span>
              <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto lg:w-[75vw] px-0 lg:px-6 -mt-10 lg:-mt-24 relative z-20 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[68%]">
            <div className="bg-white rounded-none lg:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border-b lg:border border-slate-100">
              <div className="flex p-1 lg:p-2 bg-slate-50/50 border-b border-slate-100">
                {["overview", "curriculum"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex-1 flex items-center justify-center gap-2 lg:gap-3 py-4 lg:py-5 rounded-none lg:rounded-2xl font-bold text-xs lg:text-sm uppercase tracking-wider transition-all duration-300 ${
                      activeTab === tab ? "bg-white text-blue-600 shadow-sm lg:shadow-md" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab === "overview" ? <MdOutlineDashboard size={18} /> : <FaBookOpen size={16} />}
                    {tab}
                    {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-2 w-6 h-1 bg-blue-600 rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="p-8 lg:p-14">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="admin-quill-container">
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          {activeTab === "overview" ? <MdOutlineDashboard className="text-blue-600" /> : <FaBookOpen className="text-blue-600" />}
                          Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">HTML Supported Editor</p>
                      </div>
                      <button
                        onClick={handleUpdateContent}
                        className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5"
                      >
                        <FaSave className="group-hover:rotate-12 transition-transform" />
                        <span>Update {activeTab}</span>
                      </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-slate-100 to-blue-50 rounded-[2.5rem] blur opacity-25"></div>
                      <div className="relative bg-slate-50 rounded-[2.5rem] p-4 border border-slate-200/60">
                        <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-white/50 rounded-2xl border border-white/80">
                           <div className="flex gap-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                           </div>
                           <div className="h-3 w-[1px] bg-slate-200 mx-1"></div>
                           <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{activeTab} source</span>
                        </div>
                        <textarea
                          value={activeTab === "overview" ? overviewText : curriculumText}
                          onChange={(e) => activeTab === "overview" ? setOverviewText(e.target.value) : setCurriculumText(e.target.value)}
                          className="w-full h-[450px] p-6 bg-transparent border-none focus:ring-0 font-mono text-[14px] leading-relaxed text-slate-700 resize-none"
                          placeholder={`Enter ${activeTab} HTML content here...`}
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[32%] space-y-0 md:space-y-8">
            <div className="bg-slate-900 rounded-none md:rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px]"></div>
              <div className="flex justify-between items-center mb-8 md:mb-10 relative z-10">
                <h3 className="flex items-center gap-4 text-xl md:text-2xl font-bold">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/40"><MdLayers size={24} /></div>
                  Quick Info
                </h3>
                <button onClick={() => setIsModalOpen(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><FaEdit size={16} /></button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 relative z-10">
                <SidebarItem icon={<MdPersonOutline />} label="Head of Dept." value={courseOverview.chiefInstructor} />
                <SidebarItem icon={<MdOutlineSchool />} label="Total Students" value={courseOverview.totalStudents} />
                <SidebarItem icon={<MdTimer />} label="Course Length" value={courseOverview.duration} />
                <SidebarItem icon={<MdAccountBalanceWallet />} label="Course Fees" value={courseOverview.fees} />
              </div>
              <div className="mt-10 md:mt-12 space-y-4 relative z-10">
                <Link to="/Online_Admission" className="group flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-white hover:text-blue-600 text-white py-5 rounded-xl md:rounded-2xl font-black text-lg transition-all shadow-xl">
                  Apply Now <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link to="/Contacts" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-5 rounded-xl md:rounded-2xl font-bold transition-all"><FaFacebookMessenger /> Get Consultation</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Edit Information</h3>
            <div className="space-y-6">
              {Object.entries(courseOverview).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">{key.replace(/([A-Z])/g, " $1")}</label>
                  <input type="text" value={value} onChange={(e) => setCourseOverview({ ...courseOverview, [key]: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700" />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={handleUpdateCourseOverview} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30">Save Changes</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
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
      <p className="text-xl md:text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{value || "Not Specified"}</p>
    </div>
  </div>
);

AdminDepartmentLayout.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  updateContentUrl: PropTypes.string.isRequired,
  updateCourseUrl: PropTypes.string.isRequired,
  uploadImageUrl: PropTypes.string.isRequired,
  departmentTitle: PropTypes.string.isRequired,
};

export default AdminDepartmentLayout;
