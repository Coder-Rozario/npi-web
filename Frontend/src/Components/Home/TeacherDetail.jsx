import { API_BASE_URL, placeholderImage } from "../../apiConfig";
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import 'quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slugToId = useMemo(() => ({ Chairmen: 1, principal: 2 }), []);
  const idToSlug = useMemo(() => ({ '1': 'Chairmen', '2': 'principal' }), []);
  const param = id;
  const isAuthorityRoute = location.pathname.includes('/Authority/');
  const teacherId = slugToId[param] ?? param;

  useEffect(() => {
    if (param === '1' || param === '2') {
      navigate(`/Authority/${idToSlug[param]}`, { replace: true });
    }
  }, [param, navigate, idToSlug]);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        // Determine endpoint based on current route
        const endpoint = isAuthorityRoute ? 'authority' : 'teacher';
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${teacherId}`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint} details`);
        const data = await response.json();
        setTeacher(data);
        setTimeout(() => setIsVisible(true), 100);
      } catch (error) {
        console.error('Error fetching teacher details:', error);
      }
    };
    fetchTeacher();
  }, [teacherId, isAuthorityRoute]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage(180);
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  if (!teacher) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const styles = {
    container: {
      maxWidth: isMobile ? '100%' : '70%',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      border: '1px solid #f1f5f9',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
    },
    backButton: {
      position: 'fixed',
      top: '20vh',
      left: '5vw',
      zIndex: 50,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '9999px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      color: '#0f172a'
    },
    headerGradient: {
      height: isMobile ? '120px' : '160px',
      background: 'linear-gradient(135deg, #082F49 0%, #0186C0 100%)',
    },
    imageWrapper: {
      marginTop: isMobile ? '-60px' : '-80px',
      display: 'flex',
      justifyContent: 'center',
    },
    profileImg: {
      width: isMobile ? '140px' : '180px',
      height: isMobile ? '140px' : '180px',
      objectFit: 'cover',
      borderRadius: '50%',
      border: '6px solid #ffffff',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      backgroundColor: '#fff'
    },
    bioContent: {
      lineHeight: '1.8',
      color: '#334155',
      fontSize: isMobile ? '1rem' : '1.05rem',
      textAlign: 'justify',
    }
  };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage(180);
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  return (
    <div className="px-4 py-12 bg-[#f8fafc] min-h-screen">
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/#authority');
          }
        }}
        style={styles.backButton}
        aria-label="Back to Authority"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
        </svg>
      </button>
      <div style={styles.container}>

        <div style={styles.headerGradient}></div>

        <div style={styles.imageWrapper}>
          <div className="relative">
            <img
              src={getFullImageUrl(teacher.image)}
              alt={teacher.name}
              style={styles.profileImg}
              className="hover:scale-105 transition-transform duration-500"
            />
            <div className={`absolute ${isMobile ? 'bottom-1 right-2 w-4 h-4' : 'bottom-2 right-4 w-6 h-6'} bg-green-500 border-4 border-white rounded-full`}></div>
          </div>
        </div>

        <div className="text-center px-4 md:px-6 pt-4 md:pt-6 pb-2">
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-black text-slate-800 tracking-tight`}>
            {teacher.name}
          </h2>
          <p className={`text-blue-600 font-semibold ${isMobile ? 'text-base' : 'text-lg'} mt-2 uppercase tracking-widest`}>
            {teacher.position}
          </p>
          <div className="w-16 h-1.5 bg-blue-600 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className={`px-4 md:px-8 lg:px-16 py-6 md:py-8 lg:py-10`}>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className="h-px w-8 bg-slate-300"></span>
            <h4 className="text-slate-400 uppercase text-xs font-bold tracking-[0.2em]">Biography</h4>
            <span className="h-px w-8 bg-slate-300"></span>
          </div>

          <div
            className="quill-content-view"
            style={styles.bioContent}
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(teacher.bio) 
            }}
          />
        </div>

        <div className="bg-slate-50 px-4 md:px-8 py-5 border-t border-slate-100 flex flex-col md:flex-row justify-end items-center gap-4 text-sm font-medium text-slate-500">
          <span className="italic text-center md:text-right">National Polytechnic Institute, Dhaka</span>
        </div>
      </div>

      <style>{`
        .quill-content-view p { 
          margin-bottom: 1.5rem; 
        }
        .quill-content-view strong { 
          color: #1e293b; 
          font-weight: 700; 
        }
        .quill-content-view .ql-align-center { 
          text-align: center; 
        }
        .quill-content-view .ql-align-right { 
          text-align: right; 
        }
        .quill-content-view .ql-align-left { 
          text-align: left; 
        }

        /* Smooth Scrollbar for the page */
        html { 
          scroll-behavior: smooth; 
        }

        /* Mobile specific adjustments */
        @media (max-width: 640px) {
          .quill-content-view { 
            text-align: left; 
          }
          .px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherDetail;
