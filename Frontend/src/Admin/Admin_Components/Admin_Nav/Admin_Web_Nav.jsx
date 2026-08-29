import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, faTimes, faChevronDown, faBuildingColumns, 
  faUserShield, faVideo, faExternalLinkAlt, faGraduationCap, faHouse 
} from "@fortawesome/free-solid-svg-icons"; 
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react"; 

const Admin_Web_Navbar = () => {
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

        .admin-nav-scope {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 2px solid #0186C0;
        }

        .admin-container {
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 70px;
        }

        .admin-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0186C0;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          list-style: none;
          gap: 5px;
          margin: 0;
          padding: 0;
        }

        .nav-item { position: relative; }
          .nav-item.open .dropdown { display: block; opacity: 1; visibility: visible; transform: translateY(5px); }

          .nav-link {
            text-decoration: none;
            color: #1d1d1f;
            padding: 10px 12px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
            border-radius: 8px;
            cursor: pointer;
            background: transparent;
            border: none;
          }

          .nav-link:hover { color: #0186C0; background: #f0faff; }
          .nav-link.active { color: #0186C0; background: #e6f4ff; }

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
            transition: all 0.3s ease;
            border: 1px solid #eee;
            z-index: 1000;
          }

          .nav-item:hover .dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(5px);
          }

          .dropdown a {
            display: block;
            padding: 10px 15px;
            color: #444;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            border-radius: 8px;
            transition: 0.2s;
          }

          .dropdown a:hover { background: #0186C0; color: white; }

          .explore-btn {
            background: #0186C0 !important;
            color: white !important;
            padding: 8px 20px !important;
            border-radius: 50px !important;
            margin-left: 10px;
            border: none;
            cursor: pointer;
            font-weight: 700 !important;
          }

          .mega-menu {
            position: absolute;
            top: 100%;
            right: 0;
            width: 650px;
            background: white;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            border-radius: 20px;
            padding: 25px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(15px);
            transition: 0.3s ease;
            z-index: 1000;
          }

          .mega-menu.open { opacity: 1; visibility: visible; transform: translateY(10px); }

          .mega-col-title {
            font-size: 11px;
            color: #0186C0;
            font-weight: 800;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
          }

          .mega-item {
            display: block;
            padding: 6px 0;
            color: #555;
            text-decoration: none;
            font-size: 0.85rem;
            transition: 0.2s;
          }

          .mega-item:hover { color: #0186C0; padding-left: 5px; }

          .hamburger { display: none; cursor: pointer; font-size: 24px; color: #0186C0; }

          @media (max-width: 1280px) {
            .admin-container { justify-content: space-between; padding: 0 16px; }
            .admin-logo { font-size: 1.15rem; order: 1; }
            .hamburger { display: block; order: 2; }
            .logo-text { display: inline; }
            .nav-links {
              position: fixed; top: 70px; left: ${isOpen ? '0' : '-100%'};
              width: 100%; height: calc(100vh - 70px);
              background: white; flex-direction: column; padding: 20px;
              transition: 0.4s; overflow-y: auto;
              order: 3;
            }
            .nav-item { width: 100%; }
            .dropdown { position: static; display: none; opacity: 1; visibility: visible; box-shadow: none; background: #f9f9f9; }
            .nav-item.open .dropdown { display: block; }
            .mega-menu { position: static; width: 100%; display: none; grid-template-columns: 1fr; opacity: 1; visibility: visible; transform: none; box-shadow: none; padding: 15px; background: #f9f9f9; border-radius: 12px; margin-top: 10px; }
            .mega-menu.open { display: grid; }
          }
      `}</style>

      <nav className="admin-nav-scope">
        <div className="admin-container">
          <NavLink to="/Admin" className="admin-logo">
            <FontAwesomeIcon icon={faBuildingColumns} />
            <span className="logo-text">NPI ADMIN</span>
          </NavLink>
          
          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
          </div>

          <ul className="nav-links">
            
            <li className="nav-item">
              <NavLink to="/Admin" end className="nav-link" onClick={closeMenu}>
                <FontAwesomeIcon icon={faHouse} /> Home
              </NavLink>
            </li>

            
            <li className={`nav-item ${clickedLink === "/Admin/Admin_About" ? "open" : ""}`}>
              <NavLink to="/Admin/Admin_About" className="nav-link" onClick={(e) => handleParentClick(e, "/Admin/Admin_About")}>
                About <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '8px'}}/>
              </NavLink>
              <div className="dropdown">
                <NavLink to="/Admin/Admin_Profile" onClick={closeMenu}>Institutional Profile</NavLink>
                <NavLink to="/Admin/Admin_Our_Dream" onClick={closeMenu}>Our Dream</NavLink>
                <NavLink to="/Admin/Admin_Concession_for_students" onClick={closeMenu}>Concession for Student</NavLink>
                <NavLink to="/Admin/Admin_Controlling_Authority" onClick={closeMenu}>Controlling Authority</NavLink>
                <NavLink to="/Admin/Admin_Short_Breif_of_Institute" onClick={closeMenu}>At a Glance</NavLink>
              </div>
            </li>

            
            <li className={`nav-item ${clickedLink === "/Admin/Admin_Departments" ? "open" : ""}`}>
              <NavLink to="/Admin/Admin_Departments" className="nav-link" onClick={(e) => handleParentClick(e, "/Admin/Admin_Departments")}>
                Departments <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '8px'}}/>
              </NavLink>
              <div className="dropdown">
                <NavLink to="/Admin/Admin_Architecture_Engineering" onClick={closeMenu}>Architecture</NavLink>
                <NavLink to="/Admin/Admin_Automobile_Engineering" onClick={closeMenu}>Automobile</NavLink>
                <NavLink to="/Admin/Admin_Civil_Engineering" onClick={closeMenu}>Civil</NavLink>
                <NavLink to="/Admin/Admin_Computer_Engineering" onClick={closeMenu}>Computer Engineering</NavLink>
                <NavLink to="/Admin/Admin_Electrical_Engineering" onClick={closeMenu}>Electrical</NavLink>
                <NavLink to="/Admin/Admin_Electronics_Engineering" onClick={closeMenu}>Electronics</NavLink>
                <NavLink to="/Admin/Admin_Mechanical_Engineering" onClick={closeMenu}>Mechanical</NavLink>
                <NavLink to="/Admin/Admin_Food_Technology" onClick={closeMenu}>Food Technology</NavLink>
                <NavLink to="/Admin/Admin_Textile_Engineering" onClick={closeMenu}>Textile</NavLink>
              </div>
            </li>

            
            <li className="nav-item">
              <NavLink to="/Admin/Admin_Admission" className="nav-link" onClick={closeMenu}>
                Admission
              </NavLink>
            </li>

            
            <li className="nav-item">
              <NavLink to="/Admin/Admin_Contacts" className="nav-link" onClick={closeMenu}>Contacts</NavLink>
            </li>

            
            <li className={`nav-item ${isMoreOpen ? "open" : ""}`} ref={moreRef}>
              <button className="nav-link explore-btn" onClick={toggleMore}>
                Explore <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '9px', marginLeft: '5px' }} />
              </button>
              
              <div className={`mega-menu ${isMoreOpen ? "open" : ""}`}>
                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faBuildingColumns} /> Campuses</div>
                  <NavLink to="/Admin/Admin_Dhaka_Campus" className="mega-item" onClick={closeMenu}>Dhaka</NavLink>
                  <NavLink to="/Admin/Admin_Faridpur_Campus" className="mega-item" onClick={closeMenu}>Faridpur</NavLink>
                  <NavLink to="/Admin/Admin_Manikganj_Campus" className="mega-item" onClick={closeMenu}>Manikganj</NavLink>
                  <NavLink to="/Admin/BNIST_Sonargaon_Campus" className="mega-item" onClick={closeMenu}>Sonargaon (BNIST)</NavLink>
                </div>

                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faUserShield} /> Faculty</div>
                  <NavLink to="/Admin/Admin_Teachers" className="mega-item" onClick={closeMenu}>Teachers</NavLink>
                  <NavLink to="/Admin/Admin_Staff" className="mega-item" onClick={closeMenu}>Staff</NavLink>
                </div>

                <div className="mega-col">
                  <div className="mega-col-title"><FontAwesomeIcon icon={faVideo} /> Media</div>
                  <NavLink to="/Admin/Admin_Photos" className="mega-item" onClick={closeMenu}>Photos</NavLink>
                  <NavLink to="/Admin/Admin_Videos" className="mega-item" onClick={closeMenu}>Videos</NavLink>
                  <NavLink to="/Admin/Admin_Banners" className="mega-item" onClick={closeMenu}>Banners</NavLink>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Admin_Web_Navbar;
