import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, faTimes, faChevronDown, faBuildingColumns, 
  faUserShield, faVideo, faExternalLinkAlt, faGraduationCap 
} from "@fortawesome/free-solid-svg-icons"; 
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../Images/Logo.jpg";
import { useEffect, useRef, useState } from "react"; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [clickedLink, setClickedLink] = useState(null);
  const moreRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen); 
  const closeMenu = () => {
    setIsOpen(false); 
    setIsMoreOpen(false);
    setClickedLink(null);
  };

  const toggleMore = () => setIsMoreOpen((prev) => !prev);

  const handleParentClick = (e, path) => {
    if (window.innerWidth <= 1280) {
      if (clickedLink === path) {
        closeMenu();
        navigate(path);
      } else {
        e.preventDefault();
        setClickedLink(path);
      }
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (isMoreOpen && moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isMoreOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .nav-scope {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        .nav-container {
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          height: 67px;
          transition: all 0.3s ease;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .brand-title {
          color: #0186C0;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.2px;
          line-height: 1.1;
        }

        .brand-sub {
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 1px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          list-style: none;
          gap: 4px;
          margin: 0;
          padding: 0;
        }

        .nav-item { position: relative; }

        .nav-link {
          text-decoration: none;
          color: #1d1d1f;
          padding: 8px 12px;
          font-size: 1rem;
          font-weight: 700;
          position: relative;
          transition: 0.3s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 4px;
          left: 50%;
          background: #0186C0;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .nav-link:hover::after, .nav-link.active::after { width: 70%; }
        .nav-link:hover { color: #0186C0; }

        .admission-premium {
          color: #ef4444 !important;
          font-weight: 800 !important;
          position: relative;
        }

        .admission-premium svg {
          animation: pulseIcon 2s infinite;
        }

        @keyframes pulseIcon {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .admission-premium::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          width: 0;
          height: 2px;
          background: #ef4444;
          transition: all 0.3s ease;
          transform: translateX(-50%);
          opacity: 0;
        }

        .admission-premium:hover::after, .admission-premium.active::after {
          width: 100%;
          opacity: 1;
        }

        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          min-width: 220px;
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 8px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .nav-item:hover .dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(3px);
        }

        .dropdown a {
          display: block;
          padding: 10px 14px;
          text-decoration: none;
          color: #4b5563;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: 8px;
          transition: 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown a:hover {
          background: #f0faff;
          color: #0186C0;
          padding-left: 22px;
        }

        .explore-btn {
          background: #0186C0 !important;
          color: white !important;
          padding: 10px 24px !important;
          border-radius: 50px !important;
          margin-left: 15px;
          border: none;
          cursor: pointer;
          font-weight: 700 !important;
        }

        .explore-btn::after { display: none; }
        .explore-btn:hover { background: #006da0 !important; transform: scale(1.05); }

        .mega-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 750px;
          background: white;
          box-shadow: 0 30px 60px rgba(0,0,0,0.15);
          border-radius: 24px;
          padding: 30px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mega-menu.open { opacity: 1; visibility: visible; transform: translateY(10px); }

        .mega-col-title {
          font-size: 0.75rem;
          color: #0186C0;
          font-weight: 800;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mega-item {
          display: block;
          padding: 8px 0;
          color: #555;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: 0.2s;
        }

        .mega-item:hover { color: #0186C0; transform: translateX(6px); }

        .hamburger { display: none; cursor: pointer; font-size: 26px; color: #0186C0; padding: 5px; }

        .brand-logo {
          width: 60px;
          height: 60px;
          border-radius: 9999px;
          object-fit: cover;
          transition: all 0.3s ease;
        }


        @media (max-width: 1280px) {
          .nav-container { height: 75px; padding: 0 25px; }
          .brand-title { font-size: 1.3rem; }
          .brand-sub { font-size: 12px; }
          .hamburger { display: block; font-size: 32px; }

          .nav-links {
            position: fixed; 
            top: 75px; 
            left: ${isOpen ? '0' : '-100%'}; 
            width: 100%; 
            height: calc(100dvh - 75px);
            background: white; 
            flex-direction: column; 
            padding: 30px 25px 120px 25px;
            transition: 0.4s ease-in-out;
            overflow-y: auto; 
            -webkit-overflow-scrolling: touch;
            align-items: center; 
            gap: 10px;
            box-shadow: 10px 0 30px rgba(0,0,0,0.1);
          }

          .nav-item { 
            width: 100%; 
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .nav-link { 
            font-size: 1.1rem; 
            padding: 18px; 
            border-bottom: 1px solid #f0f0f0; 
            width: 100%;
            justify-content: center;
            text-align: center;
            font-weight: 700;
          }

          .dropdown { 
            position: static; 
            opacity: 1; 
            visibility: visible; 
            display: none; 
            box-shadow: none; 
            padding: 10px 0;
            transform: none;
            min-width: 100%;
            background: #f8fafc;
            width: 100%;
            margin-top: 8px;
            border-radius: 12px;
          }

          .nav-item:hover .dropdown { 
            display: block; 
          }

          .dropdown a {
            text-align: left;
            width: 90%;
            max-width: 350px;
            margin: 5px auto;
            font-size: 1rem;
            padding: 12px 20px;
          }

          .mega-menu { 
            position: static; 
            width: 100%; 
            display: ${isMoreOpen ? 'grid' : 'none'}; 
            grid-template-columns: 1fr; 
            box-shadow: none; 
            opacity: 1; 
            visibility: visible; 
            transform: none;
            padding: 25px;
            background: #f0faff;
            border-radius: 20px;
            margin-top: 15px;
            gap: 20px;
          }

          .mega-col {
            text-align: left;
          }

          .mega-col-title {
            font-size: 0.9rem;
            margin-bottom: 12px;
          }

          .mega-item {
            font-size: 1.05rem;
            padding: 10px 0;
          }

          .explore-btn { 
            width: 100%; 
            margin: 20px 0; 
            text-align: center; 
            justify-content: center;
            font-size: 1.1rem !important;
            padding: 15px 30px !important;
          }

          .nav-link svg {
            margin-left: 8px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .brand-title { font-size: 0.95rem; white-space: nowrap; }
          .brand-sub { font-size: 9px; }
          .brand-logo { width: 42px; height: 42px; }
          .hamburger { font-size: 24px; }
          .nav-container { padding: 0 12px; height: 58px; }
          .nav-links { top: 58px; height: calc(100dvh - 58px); }
        }

        @media (max-width: 360px) {
          .brand-title { font-size: 0.85rem; }
          .brand-logo { width: 38px; height: 38px; }
          .nav-link { font-size: 1.05rem; padding: 15px; }
          .dropdown a { max-width: 280px; font-size: 0.95rem; }
        }
      `}</style>

      <nav className="nav-scope">
        <div className="nav-container">
          <Link to="/" className="brand" onClick={closeMenu}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: '#0186C0', borderRadius: '9999px', filter: 'blur(12px)', opacity: 0.12 }}></div>
              <motion.div whileHover={{ scale: 1.05 }} style={{ position: 'relative', background: 'white', padding: '2px', borderRadius: '9999px', boxShadow: '0 1px 2px rgba(16,24,40,0.06)', border: '1px solid #e6f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={logo} alt="National Polytechnic Institute (NPI) Dhaka Logo" loading="lazy" decoding="async" className="brand-logo" />
              </motion.div>
            </div>
            <div>
              <div className="brand-title">National Polytechnic Institute</div>
              <div className="brand-sub">
                <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'rgba(1,134,192,0.3)' }}></span>
                <span>Dhaka</span>
              </div>
            </div>
          </Link>

          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
          </div>

          <ul className="nav-links">
            <li className="nav-item">
              <NavLink to="/" className="nav-link" onClick={closeMenu}>Home</NavLink>
            </li>

            <li className="nav-item">
              <NavLink 
                to="/About" 
                className="nav-link" 
                onClick={(e) => handleParentClick(e, "/About")}
              >
                About <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '8px'}}/>
              </NavLink>
              <div className="dropdown">
                <NavLink to="/Profile" onClick={closeMenu}>Institutional Profile</NavLink>
                <NavLink to="/Our_Dream" onClick={closeMenu}>Our Dream</NavLink>
                <NavLink to="/Concession_for_students" onClick={closeMenu}>Concession for Students</NavLink>
                <NavLink to="/Controlling_Authority" onClick={closeMenu}>Controlling Authority</NavLink>
                <NavLink to="/Short_Breif_of_Institute" onClick={closeMenu}>At a Glance</NavLink>
                <NavLink to="/Teachers" onClick={closeMenu}>Teacher & Officer</NavLink>
                <NavLink to="/Staff" onClick={closeMenu}>Administrative Staff</NavLink>
              </div>
            </li>

            <li className="nav-item">
              <NavLink 
                to="/Departments" 
                className="nav-link"
                onClick={(e) => handleParentClick(e, "/Departments")}
              >
                Departments <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '8px'}}/>
              </NavLink>
              <div className="dropdown" style={{minWidth: '260px'}}>
                <NavLink to="/Architecture_Engineering" onClick={closeMenu}>Architecture Engineering</NavLink>
                <NavLink to="/Automobile_Engineering" onClick={closeMenu}>Automobile Engineering</NavLink>
                <NavLink to="/Civil_Engineering" onClick={closeMenu}>Civil Engineering</NavLink>
                <NavLink to="/Computer_Engineering" onClick={closeMenu}>Computer Engineering</NavLink>
                <NavLink to="/Electrical_Engineering" onClick={closeMenu}>Electrical Engineering</NavLink>
                <NavLink to="/Electronics_Engineering" onClick={closeMenu}>Electronics Engineering</NavLink>
                <NavLink to="/Mechanical_Engineering" onClick={closeMenu}>Mechanical Engineering</NavLink>
                <NavLink to="/Food_Technology" onClick={closeMenu}>Food Technology</NavLink>
                <NavLink to="/Textile_Engineering" onClick={closeMenu}>Textile Engineering</NavLink>
              </div>
            </li>

            <li className="nav-item">
              <NavLink 
                to="/Online_Admission" 
                className="nav-link admission-premium" 
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faGraduationCap} /> Online Admission
              </NavLink>
            </li>

            <li className="nav-item">
              <a 
                href="https://btebresultszone.com/institute-results/50114" 
                target="_blank" 
                rel="noreferrer" 
                className="nav-link" 
                onClick={closeMenu}
              >
                Result
              </a>
            </li>

            <li className="nav-item">
              <NavLink 
                to="/Notice" 
                className="nav-link"
                onClick={(e) => handleParentClick(e, "/Notice")}
              >
                Notice <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '8px'}}/>
              </NavLink>
              <div className="dropdown">
                <NavLink to="/Notice" onClick={closeMenu}>General Notice</NavLink>
                <a href="https://bteb.gov.bd/site/view/notices" target="_blank" rel="noreferrer" onClick={closeMenu}>
                  BTEB Official Notice <FontAwesomeIcon icon={faExternalLinkAlt} style={{fontSize: '10px', marginLeft: '5px'}}/>
                </a>
              </div>
            </li>

            <li className="nav-item">
              <NavLink to="/Contacts" className="nav-link" onClick={closeMenu}>Contacts</NavLink>
            </li>

            <li className="nav-item" ref={moreRef}>
              <button className="nav-link explore-btn" onClick={toggleMore}>
                Explore More<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px', marginLeft: '5px', transform: isMoreOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              <div className={`mega-menu ${isMoreOpen ? "open" : ""}`}>
                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faBuildingColumns} /> Campuses</div>
                  <NavLink to="/Dhaka_Campus" className="mega-item" onClick={closeMenu}>Dhaka Campus</NavLink>
                  <NavLink to="/Faridpur_Campus" className="mega-item" onClick={closeMenu}>Faridpur Campus</NavLink>
                  <NavLink to="/Manikganj_Campus" className="mega-item" onClick={closeMenu}>Manikganj Campus</NavLink>
                  <NavLink to="/Sonargaon_Campus" className="mega-item" onClick={closeMenu}>BNIST, Sonargaon</NavLink>
                </div>

                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faUserShield} /> Faculty</div>
                  <NavLink to="/Teachers" className="mega-item" onClick={closeMenu}>Teacher & Officer</NavLink>
                  <NavLink to="/Staff" className="mega-item" onClick={closeMenu}>Administrative Staff</NavLink>
                </div>

                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faVideo} /> Media</div>
                  <NavLink to="/PhotoGallery" className="mega-item" onClick={closeMenu}>Photo Gallery</NavLink>
                  <NavLink to="/Activities" className="mega-item" onClick={closeMenu}>Video Gallery</NavLink>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
