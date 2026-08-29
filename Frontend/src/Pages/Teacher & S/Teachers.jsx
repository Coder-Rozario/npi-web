import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState, useRef } from "react";
import { FaEnvelope, FaGraduationCap, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import altpic from '../../Images/download.png';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);
  const selectedDeptRef = useRef("All");
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const defaultAvatar = altpic;

  const departments = [
    "All",
    "Architecture Technology",
    "Automobile Technology",
    "Civil Technology",
    "Computer Technology",
    "Electrical Technology",
    "Electronics Technology",
    "Mechanical Technology",
    "Food Technology",
    "Textile Technology",
    "R.S "
  ];

  const filterTeachers = (list, dept) => {
    if (dept === "All") return list;

    const normalize = (s) => (s || "").toLowerCase().replace(/engineering/g, 'technology').trim();
    const targetDept = normalize(dept);

    const keywordsMap = {
      "Architecture Technology": ["architecture", "arch"],
      "Automobile Technology": ["automobile", "auto"],
      "Civil Technology": ["civil"],
      "Computer Technology": ["computer", "cmt", "cst"],
      "Electrical Technology": ["electrical", "elec"],
      "Electronics Technology": ["electronics", "electro"],
      "Mechanical Technology": ["mechanical", "mech"],
      "Food Technology": ["food"],
      "Textile Technology": ["textile", "tex"],
      "R.S ": ["general science", "physics", "chemistry", "math", "english", "science", "r.s", "rs"]
    };

    return list.filter((t) => {
      const teacherDept = normalize(t.department || "");
      const teacherPos = (t.position || "").toLowerCase();
      if (teacherDept === targetDept) return true;

      const keywords = keywordsMap[dept] || [dept.toLowerCase().split(' ')[0]];
      return keywords.some((kw) => {
        if (kw.length <= 4) {
          const regex = new RegExp(`\\b${kw.replace('.', '\\.') }\\b`, 'i');
          return regex.test(teacherPos);
        }
        return teacherPos.includes(kw.toLowerCase());
      });
    });
  };

  const fetchTeachers = async (dept = selectedDeptRef.current) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teachers?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Teachers fetch failed: ${response.status}`);
      const data = await response.json();
      const teacherList = Array.isArray(data) ? data : [];
      setTeachers(teacherList);
      setFilteredTeachers(filterTeachers(teacherList, dept));
    } catch (err) {
      console.error('Error fetching data:', err);
      setTeachers([]);
      setFilteredTeachers([]);
    }
  };

  useEffect(() => {
    fetchTeachers();
    const handleFocus = () => fetchTeachers();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === "") return defaultAvatar;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  const handleFilter = (dept) => {
    selectedDeptRef.current = dept;
    setSelectedDept(dept);
    setFilteredTeachers(filterTeachers(teachers, dept));
  };

  const imageShape = {
    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
  };
  
  const displayTeachers = filteredTeachers;

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 md:px-10 font-sans">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Meet Our <span className="text-indigo-600">Teachers</span>
        </h2>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 border border-slate-200 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">
            {displayTeachers.length} Professionals Found
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse gap-8">

        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white p-4 lg:p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-10 overflow-hidden">
            <div className="flex items-center gap-3 mb-4 lg:mb-6 px-2">
              <div className="bg-[#0186C0] p-2 rounded-xl text-white">
                <FaFilter size={14} />
              </div>
              <h3 className="font-bold text-slate-800 tracking-wide">Departments</h3>
            </div>

            <div className="relative group">
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md p-2 rounded-full lg:hidden border border-slate-100 text-slate-600 active:scale-95 transition-transform"
                aria-label="Scroll Left"
              >
                <FaChevronLeft size={12} />
              </button>

              <div
                ref={scrollContainerRef}
                className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide scroll-smooth px-8 lg:px-0"
              >
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => handleFilter(dept)}
                    className={`px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 whitespace-nowrap text-left border-2 flex-shrink-0 lg:flex-shrink
                      ${selectedDept === dept
                        ? "bg-[#0186C0] border-[#0186C0] text-white shadow-lg shadow-blue-100"
                        : "bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-[#0186C0]"}
                    `}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md p-2 rounded-full lg:hidden border border-slate-100 text-slate-600 active:scale-95 transition-transform"
                aria-label="Scroll Right"
              >
                <FaChevronRight size={12} />
              </button>

              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none lg:hidden z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none lg:hidden z-10" />
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          {displayTeachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayTeachers.map((teacher) => {
                const isHovered = hoveredId === teacher.id;
                const teacherImg = getImageUrl(teacher.image);
                
                // Check if teacher has qualification or email
                const hasQualification = teacher.qualification?.trim();
                const hasEmail = teacher.email?.trim();
                const hasInfo = hasQualification || hasEmail;

                return (
                  <div
                    key={teacher.id}
                    onMouseEnter={() => setHoveredId(teacher.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative bg-white rounded-[2.5rem] p-8 transition-all duration-500 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-2 flex flex-col items-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />

                    <div className="relative mb-6 z-10">
                      <div
                        style={{
                            ...imageShape,
                            ...(isHovered ? { borderRadius: "40%" } : {}),
                            backgroundColor: teacher.image ? 'transparent' : '#f1f5f9'
                        }}
                        className={`w-32 h-32 md:w-36 md:h-36 overflow-hidden transition-all duration-700 ring-8 ring-white shadow-md flex items-center justify-center ${isHovered ? 'border-[5px] border-[#0186C0]' : ''}`}
                      >
                        <img
                          src={teacherImg}
                          alt={teacher.name}
                          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                          onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                        />
                      </div>
                    </div>

                    <div className="relative z-10 text-center w-full flex flex-col">
                      <h3 className="text-lg font-black text-slate-800 group-hover:text-[#0186C0] transition-colors">
                        {teacher.name}
                      </h3>
                      <p className="text-[#0186C0] font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                        {teacher.position || "Faculty Member"}
                      </p>
                      
                      {/* Department - always show if exists */}
                      {teacher.department?.trim() && (
                        <p className="text-slate-500 text-[12px] font-medium mt-2">
                          {teacher.department}
                        </p>
                      )}
                      
                      {/* Info section - conditionally render with consistent spacing */}
                      {hasInfo ? (
                        <div className="mt-4 space-y-2.5 w-full border-t border-slate-50 pt-4">
                          {/* Qualification - always in first position when present */}
                          {hasQualification && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-blue-50">
                              <FaGraduationCap className="text-[#0186C0] flex-shrink-0" size={16} />
                              <span className="text-[11px] font-bold text-slate-600 truncate uppercase">
                                {teacher.qualification}
                              </span>
                            </div>
                          )}

                          {/* Email - always in second position when present */}
                          {hasEmail && (
                            <a
                              href={`mailto:${teacher.email}`}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-blue-50"
                            >
                              <FaEnvelope className="text-[#0186C0] flex-shrink-0" size={14} />
                              <span className="text-[11px] font-bold text-slate-600 truncate">
                                {teacher.email}
                              </span>
                            </a>
                          )}
                        </div>
                      ) : (
                        /* Empty spacer to maintain card height consistency */
                        <div className="mt-4 h-[76px]"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FaFilter className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No teachers found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers;