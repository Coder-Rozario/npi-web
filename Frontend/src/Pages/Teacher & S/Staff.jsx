import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState } from "react";
import Loading from "../../Components/Loading/Loading";
import { toast } from "react-toastify";
import altpic from '../../Images/download.png';

const Staff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const defaultMaleImage = 'https://static.vecteezy.com/system/resources/previews/003/715/527/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-vector.jpg';
  const defaultFemaleImage = 'https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-profile-picture-business-profile-woman-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-1325.jpg?semt=ais_hybrid';

  const getDefaultImage = (name) => {
    const maleSuffixes = ['Mr', 'Dr', 'Prof'];
    const isMale = maleSuffixes.some((suffix) => name.startsWith(suffix));
    return isMale ? defaultMaleImage : defaultFemaleImage;
  };

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/staff`);
        if (!response.ok) {
          throw new Error('Failed to fetch staff data');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setStaffMembers(data);
        } else {
          console.error('Unexpected staff data format:', data);
          setStaffMembers([]);
        }
      } catch (error) {
        setError(error.message);
        toast.error('Failed to fetch staff data');
        console.error('Error fetching staff data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  if (loading) {
    return <div><Loading /></div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const imageShape = {
    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
  };

  return (
    <div className="bg-slate-50 min-h-screen  sm:py-5">
      <div className="text-center mb-8 sm:mb-16 px-4">
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
          Staff
        </h2>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 sm:px-6 py-1.5 shadow-sm">
          <span className="text-indigo-600 font-bold text-sm sm:text-base">{staffMembers.length}</span>
          <span className="text-slate-700 font-semibold text-xs sm:text-sm">Team Members</span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {staffMembers.map((staff) => {
            const isHovered = hoveredId === staff.id;
            const staffImg = staff.image && staff.image !== ""
              ? (staff.image.startsWith('http') ? staff.image : `${API_BASE_URL}/${staff.image}`)
              : altpic;
            return (
              <div
                key={staff.id}
                onMouseEnter={() => setHoveredId(staff.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative bg-white rounded-3xl p-6 md:p-10 text-center transition-all duration-300 border overflow-hidden cursor-pointer m-[5px] ${isHovered ? "border-[5px] border-[#0186C0] shadow-2xl -translate-y-1" : "border-slate-100 shadow-lg"}`}
              >
                <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-sky-50" />
                <div className="relative mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36">
                  <img
                    alt={staff.name + " - Best Polytechnic in Bangladesh Staff"}
                    src={staffImg}
                    style={{ ...imageShape, ...(isHovered ? { borderRadius: "50%" } : {}) }}
                    className="w-full h-full object-cover bg-slate-100 transition-all duration-500"
                    onError={(e) => { e.currentTarget.src = altpic; }}
                  />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-2">
                  {staff.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-xs sm:text-sm">
                  {staff.position}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Staff;
