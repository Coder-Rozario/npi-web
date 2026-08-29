import { API_BASE_URL } from "../../../apiConfig";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Admin_Home_Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/department?t=${new Date().getTime()}`);
        console.log("API Response:", response.data);
        if (Array.isArray(response.data)) {
          const transformedData = response.data.map(dept => {
            if (dept.name === 'Computer Science and Technology') {
              return { ...dept, name: 'Computer Engineering' };
            }
            return dept;
          });
          setDepartments(transformedData);
        } else {
          console.error("Unexpected departments data format:", response.data);
          setDepartments([]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const handleCardClick = (link) => {
    navigate(`/Admin/${link}`);
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/default-image.jpg";
    if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
    const reBackslash = /\\/g;
    const reApi = /^\/?api\/?/;
    const reUploads = /^\/?uploads\/?/;
    const cleanPath = photoPath.replace(reBackslash, '/').replace(reApi, '').replace(reUploads, '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  return (
    <div className="All_Cards py-16 bg-slate-50/50">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 mb-4">
          OUR <span style={{ color: '#0186C0' }}>DEPARTMENTS</span>
        </h1>
        <div className="w-20 md:w-24 h-1.5 bg-[#0186C0] mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 p-6">
        {departments.map((dept, index) => (
          <div
            key={index}
            className="card bg-white w-full shadow-md rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:shadow-lg hover:scale-105"
            onClick={() => handleCardClick(`Admin_${dept.name.replace(/\s+/g, "_")}`)}
          >
            <figure className="h-40 w-full overflow-hidden">
              <img
                src={getImageUrl(dept.hero_image)}
                alt={dept.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => { e.target.src = "/default-image.jpg"; }}
              />
            </figure>
            <div className="p-4">
              <h2 className="font-semibold text-lg mb-2">{dept.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin_Home_Departments;
