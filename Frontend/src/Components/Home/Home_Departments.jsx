import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLoadingManager } from "../Loading/LoadingManager";
import LoadingSpinner from "../Loading/LoadingSpinner";
import useAutoRefresh from "../../hooks/useAutoRefresh";

import { API_BASE_URL } from "../../apiConfig";

const Home_Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState(() => {
    try {
      const cached = sessionStorage.getItem('department_list');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });
  const { markLoaded } = useLoadingManager();

  const { loading } = useAutoRefresh(
    async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/department`);
        const departmentList = Array.isArray(res?.data) ? res.data : [];

        if (!departmentList.length) {
          setDepartments([]);
          sessionStorage.setItem('department_list', JSON.stringify([]));
          return [];
        }

        const transformedData = departmentList.map(dept => {
          if (dept.name === 'Computer Science and Technology') {
            return { ...dept, name: 'Computer Engineering' };
          }
          if (dept.name === 'Architecture Technology') {
            return { ...dept, name: 'Architecture Engineering' };
          }
          return dept;
        });
        setDepartments(transformedData);
        sessionStorage.setItem('department_list', JSON.stringify(transformedData));
        return transformedData;
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
        sessionStorage.setItem('department_list', JSON.stringify([]));
        return [];
      } finally {
        markLoaded("Departments");
      }
    },
    [],
    {
      intervalMs: 1200,
      maxIntervalMs: 6000,
      timeoutMs: 7000,
      isReady: (data) => Array.isArray(data)
    }
  );

  const handleCardClick = (link) => {
    navigate(link);
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/default-image.jpg";
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;

    const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  if (!loading && departments.length === 0) {
    return null;
  }

  return (
    <div className="All_Cards relative min-h-[400px] py-16 bg-slate-50/50" data-aos="fade-up" aria-busy={loading ? "true" : "false"}>
      {loading && <LoadingSpinner overlay />}

      <div className="text-center mb-12 md:mb-20">
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
          OUR <span style={{ color: '#0186C0' }}>DEPARTMENTS</span>
        </h2>
        <div className="w-24 h-2 bg-gradient-to-r from-[#0186C0] to-indigo-600 mx-auto rounded-full shadow-sm"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-[5px]">
          {departments.map((dept, index) => (
            <div
              key={index}
              data-aos="zoom-in"
              data-aos-delay={index * 50}
              className="group relative bg-white w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-10px)] lg:w-[calc(25%-10px)] xl:w-[calc(20%-10px)] min-w-[240px]
                         rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3
                         transition-all duration-500 ease-out border border-slate-100 cursor-pointer m-[5px]"
              onClick={() => handleCardClick(`/${dept.name.replace(/\s+/g, "_").replace(/&/g, "and")}`)}
            >

              <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                <img
                  src={getImageUrl(dept.hero_image)}
                  alt={`${dept.name} department at National Polytechnic Institute NPI Dhaka - Best Polytechnic in Bangladesh`}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = "/default-image.jpg"; }}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="p-5 bg-white relative">

                <div className="absolute top-0 left-0 w-0 h-1 bg-[#0186C0] transition-all duration-500 group-hover:w-full" />

                <h2 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-[#0186C0] transition-colors duration-300">
                  {dept.name}
                </h2>
                <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-widest">
                  Explore Department
                </p>
              </div>

              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full transform skew-x-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home_Departments;
