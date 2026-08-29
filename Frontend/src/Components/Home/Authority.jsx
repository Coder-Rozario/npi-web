import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState, useMemo } from 'react';
import LoadingSpinner from '../Loading/LoadingSpinner';
import { useLoadingManager } from '../Loading/LoadingManager';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const Authority = () => {
   const navigate = useNavigate();
   const { markLoaded } = useLoadingManager();
   const [teachers, setTeachers] = useState(() => {
      try {
         const cached = sessionStorage.getItem('authority_list');
         return cached ? JSON.parse(cached) : [];
      } catch (_) {
         return [];
      }
   });

   const { loading, error } = useAutoRefresh(
      async () => {
         try {
            const response = await fetch(`${API_BASE_URL}/authority`);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

            if (list.length > 0) {
               setTeachers(list);
               sessionStorage.setItem('authority_list', JSON.stringify(list));
            }
            return list;
         } catch (err) {
            console.error('Authority fetch error:', err);
            throw err;
         } finally {
            markLoaded("Authority");
         }
      },
      [],
      {
         intervalMs: 2000,
         maxIntervalMs: 10000,
         timeoutMs: 15000,
         isReady: (data) => Array.isArray(data)
      }
   );

   const handleCardClick = (id) => {
      if (id === 1) {
         navigate(`/Authority/Chairmen`);
      } else if (id === 2) {
         navigate(`/Authority/principal`);
      } else {
         navigate(`/Authority/${id}`);
      }
   };

   const getFullImageUrl = (photoPath) => {
      if (!photoPath) return "/default-image.jpg";
      if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;

      const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
      return `${API_BASE_URL}/uploads/${cleanPath}`;
   };

   if (!loading && (!Array.isArray(teachers) || teachers.length === 0) && !error) {
      return null;
   }

   return (
      <div className="Header relative min-h-[300px]" style={{ background: '#f8fafc', padding: '60px 0' }}>
         {loading && <LoadingSpinner overlay />}
         <div id="administration-corner" className="" >
            <div className="text-center mb-10 md:mb-16">
               <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">
                  Administration <span style={{ color: '#0186C0' }}>Corner</span>
               </h2>
               <div className="w-20 md:w-24 h-1.5 bg-[#0186C0] mx-auto rounded-full"></div>
            </div>
         </div>

         <div className="container mx-auto">
            <div className="admin_cell flex flex-wrap justify-center gap-6 md:gap-10 p-5">
               {teachers.length === 0 && error && <div className="text-red-600 text-center w-full">Unable to load authority list. Retrying...</div>}
               {teachers.length === 0 && !loading && !error && <div className="text-center w-full">No records found.</div>}

               {(Array.isArray(teachers) ? teachers : []).map(teacher => (
                  <div key={teacher.id} data-aos="zoom-in-up" className="flex justify-center">
                     <div
                        className="premium-card"
                        onClick={() => handleCardClick(teacher.id)}
                     >
                        <div className="image-container">
                           <img
                              alt={`${teacher.name} - ${teacher.position} at National Polytechnic Institute (NPI) Dhaka`}
                              src={getFullImageUrl(teacher?.image)}
                           />
                        </div>
                        <div className="content-overlay">
                           <h3>{teacher.name}</h3>
                           <p className="position">{teacher.position}</p>
                           <button className="read-more-btn">
                              More Info
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <style>{`
            .premium-card {
               position: relative;
               background: #ffffff;
               border-radius: 20px;
               overflow: hidden;
               box-shadow: 0 10px 30px rgba(0,0,0,0.05);
               transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
               cursor: pointer;
               width: 100%;
               max-width: 320px;
               height: 380px;
               border: 1px solid rgba(255,255,255,0.3);
               margin: 5px; /* Global spacing update */
            }

            .premium-card:hover {
               transform: translateY(-10px);
               box-shadow: 0 20px 40px rgba(0,0,0,0.12);
               border: 5px solid #0186C0; /* Global hover effect update */
            }

            .image-container {
               width: 100%;
               height: 100%;
               overflow: hidden;
            }

            .image-container img {
               width: 100%;
               height: 100%;
               object-fit: cover;
               transition: transform 0.6s ease;
            }

            .premium-card:hover .image-container img {
               transform: scale(1.1);
            }

            .content-overlay {
               position: absolute;
               bottom: 0;
               left: 0;
               right: 0;
               padding: 0px 20px;
               background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
               color: white;
               transition: all 0.4s ease;
            }

            .premium-card:hover .content-overlay {
               background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 100%);
               height: 55%;
               display: flex;
               flex-direction: column;
               justify-content: center;
               align-items: center;
               text-align: center;
            }

            .content-overlay h3 {
               margin: 0;
               font-size: 1.2rem;
               font-weight: 700;
               letter-spacing: 0.5px;
            }

            @media (min-width: 768px) {
               .content-overlay h3 {
                  font-size: 1.3rem;
               }
            }

            @media (min-width: 1200px) {
               .content-overlay h3 {
                  font-size: 1.4rem;
               }
            }

            .position {
               margin: 5px 0 10px 0;
               font-size: 0.85rem;
               color: #e2e8f0;
               font-weight: 300;
            }

            @media (min-width: 768px) {
               .position {
                  margin: 8px 0 12px 0;
                  font-size: 0.9rem;
               }
            }

            @media (min-width: 1200px) {
               .position {
                  margin: 8px 0 15px 0;
                  font-size: 0.95rem;
               }
            }

            .read-more-btn {
               opacity: 0;
               transform: translateY(20px);
               transition: all 0.4s ease;
               background: #0186C0;
               color: white;
               border: none;
               padding: 8px 16px;
               border-radius: 30px;
               font-weight: 600;
               font-size: 0.85rem;
               display: flex;
               align-items: center;
               gap: 6px;
               cursor: pointer;
            }

            @media (min-width: 768px) {
               .read-more-btn {
                  padding: 10px 20px;
                  font-size: 0.9rem;
                  gap: 8px;
               }
            }

            .premium-card:hover .read-more-btn {
               opacity: 1;
               transform: translateY(0);
            }

            .read-more-btn:hover {
               background: #0369A1;
            }

            .read-more-btn svg {
               width: 16px;
               height: 16px;
            }

            @media (min-width: 768px) {
               .read-more-btn svg {
                  width: 18px;
                  height: 18px;
               }
            }
         `}</style>
      </div>
   );
};

export default Authority;
