import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHouse, 
  faEnvelope, 
  faPhone, 
  faLink, 
  faChevronRight,
  faUserGraduate,
  faChalkboardTeacher,
  faUsers,
  faBell, 
  faFileContract,
  faGlobe,
  faBuilding,
  faAddressCard,
  faHeadset
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState } from "react";
import axios from "axios";

const Footer = () => {
  const [contactDetails, setContactDetails] = useState({
    address: "Loading...",
    email: "Loading...",
    phone: "Loading...",
  });
  const [socialLinks, setSocialLinks] = useState({
    facebookLink: "",
    linkedinLink: "",
    twitterLink: "",
    youtubeLink: "",
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/contact`);
        setContactDetails(response.data);
      } catch (error) {
        console.error("Error fetching contact details:", error);
      }
    };
    const fetchSocialLinks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/get-web-data`);
        const data = response.data || {};
        setSocialLinks({
          facebookLink: typeof data.facebookLink === "string" ? data.facebookLink : "",
          linkedinLink: typeof data.linkedinLink === "string" ? data.linkedinLink : "",
          twitterLink: typeof data.twitterLink === "string" ? data.twitterLink : "",
          youtubeLink: typeof data.youtubeLink === "string" ? data.youtubeLink : "",
        });
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };
    fetchContactDetails();
    fetchSocialLinks();
  }, []);

  const currentYear = new Date().getFullYear();

  const QuickLink = ({ to, label, icon = faChevronRight }) => (
    <Link 
      to={to} 
      className="group flex items-center gap-2 text-gray-400 hover:text-[#0186C0] transition-all duration-300 py-1"
    >
      <div className="w-4 flex justify-center">
        <FontAwesomeIcon 
          icon={icon} 
          className="text-[12px] opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#0186C0]" 
        />
      </div>
      <span className="group-hover:translate-x-1 transition-transform">{label}</span>
    </Link>
  );

  const ContactPageLink = ({ to, label, icon }) => (
    <Link 
      to={to} 
      className="group flex items-center gap-2 text-[#0186C0] font-medium transition-all duration-300 py-1 transform hover:scale-105 origin-left"
    >
      <div className="w-4 flex justify-center">
        <FontAwesomeIcon 
          icon={icon} 
          className="text-[14px]" 
        />
      </div>
      <span>{label}</span>
    </Link>
  );

  const ExternalLink = ({ href, label }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-gray-400 hover:text-[#0186C0] transition-colors py-1 text-sm"
    >
      <FontAwesomeIcon icon={faLink} className="text-xs text-gray-500" />
      <span>{label}</span>
    </a>
  );

  return (
    <footer className="bg-[#0f172a] text-gray-300 font-sans border-t border-gray-800">
      <style>{`
        @media (max-width: 768px) {
          .footer-section-title { font-size: 1.25rem !important; }
          .footer-text { font-size: 1.05rem !important; }
          .footer-link-text { font-size: 1rem !important; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">

        <div className="space-y-6">
          <h6 className="footer-section-title text-white text-lg font-bold tracking-wider uppercase border-b-2 border-[#0186C0] w-fit pb-1">
            Keep In Touch
          </h6>
          <div className="footer-text flex flex-col items-start space-y-4 text-sm">
            <div className="flex items-start gap-4">
              <FontAwesomeIcon icon={faHouse} className="mt-1 text-gray-500 w-4" />
              <span className="leading-relaxed text-left">{contactDetails.address}</span>
            </div>
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 w-4" />
              <a href={`mailto:${contactDetails.email}`} className="hover:text-[#0186C0] transition-colors">
                {contactDetails.email}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faPhone} className="text-gray-500 w-4" />
              <span>{contactDetails.phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h6 className="footer-section-title text-white text-lg font-bold tracking-wider uppercase border-b-2 border-[#0186C0] w-fit pb-1">
            Quick Navigation
          </h6>
          <nav className="footer-link-text flex flex-col gap-1 items-start">
            <QuickLink to="/" label="Home" icon={faHouse} />
            <QuickLink to="/Online_Admission" label="Online Admission" icon={faAddressCard} />
            <QuickLink to="/Departments" label="All Departments" icon={faBuilding} />
            <QuickLink to="/Teacher_and_Staff" label="Teachers and Staff" icon={faChalkboardTeacher} />
            <QuickLink to="/Controlling_Authority" label="Student Portal" icon={faUserGraduate} />
            <QuickLink to="/Notice" label="Academic Notice" icon={faBell} />
            <a 
              href="https://btebresultszone.com/institute-results/50114" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-gray-400 hover:text-[#0186C0] transition-all duration-300 py-1"
            >
              <div className="w-4 flex justify-center">
                <FontAwesomeIcon 
                  icon={faFileContract} 
                  className="text-[12px] opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#0186C0]" 
                />
              </div>
              <span className="group-hover:translate-x-1 transition-transform">Examination Results</span>
            </a>
            <QuickLink to="/Academic" label="All Campuses" icon={faGlobe} />
          </nav>
        </div>

        <div className="space-y-6">
          <h6 className="footer-section-title text-white text-lg font-bold tracking-wider uppercase border-b-2 border-[#0186C0] w-fit pb-1">
            Important Links
          </h6>
          <div className="footer-link-text grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-1 items-start">
            <ExternalLink href="https://bteb.gov.bd/" label="BTEB Official" />
            <ExternalLink href="https://www.duet.ac.bd/" label="DUET Admission" />
            <ExternalLink href="https://www.npiub.edu.bd/" label="NPIUB Portal" />
            <ExternalLink href="https://www.facebook.com/NationalPolytechnicInstituteManikganj/" label="NPI Manikganj" />
            <ExternalLink href="https://www.facebook.com/p/Bahaul-Huq-NPI-Institute-Of-Science-And-Technology-100063487343352/" label="BNIST Page" />
          </div>
        </div>

        <div className="hidden lg:block space-y-6">
          <h6 className="text-white text-lg font-bold tracking-wider uppercase border-b-2 border-[#0186C0] w-fit pb-1">
            Connect With Us
          </h6>
          <div className="space-y-4">
            <ContactPageLink to="/Contacts" label="Go to Contact Page" icon={faHeadset} />

            <p className="text-xs text-gray-500 leading-relaxed">
              Stay connected through our official social media channels for the latest updates and news.
            </p>
            <div className="flex flex-row items-center gap-2">
              {[
                { href: socialLinks.facebookLink, path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" },
                { href: socialLinks.youtubeLink, path: "M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" },
                { href: socialLinks.linkedinLink, path: "M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.27c-.96 0-1.73-.78-1.73-1.73s.78-1.73 1.73-1.73 1.73.78 1.73 1.73-.78 1.73-1.73 1.73zm13.5 10.27h-3v-4.87c0-1.16-.04-2.65-1.61-2.65s-1.86 1.26-1.86 2.57v4.95h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.85-1.54 3.05 0 3.62 2.01 3.62 4.63v5.68z" },
                { href: socialLinks.twitterLink, path: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.61 1.798-1.574 2.166-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.722 0-4.928 2.205-4.928 4.927 0 .386.043.762.127 1.124-4.094-.206-7.725-2.168-10.161-5.151-.424.727-.667 1.571-.667 2.471 0 1.705.868 3.213 2.188 4.096-.806-.026-1.566-.247-2.228-.616v.062c0 2.382 1.693 4.371 3.946 4.821-.413.112-.848.172-1.296.172-.317 0-.626-.031-.928-.089.627 1.956 2.445 3.378 4.6 3.418-1.684 1.319-3.808 2.106-6.115 2.106-.397 0-.788-.023-1.173-.068 2.179 1.397 4.768 2.214 7.557 2.214 9.054 0 14.01-7.505 14.01-14.01l-.017-.638C22.505 6.4 23.34 5.543 24 4.557z" },
              ]
                .filter((item) => typeof item.href === "string" && item.href.trim() !== "" && item.href.trim() !== "#")
                .map((item, index) => (
                  <SocialIcon key={index} href={item.href} path={item.path} />
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0b1120] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-left">

          <aside className="order-2 md:order-1">
            <p className="text-xs text-gray-500 leading-loose">
              &copy; {currentYear} <span className="text-gray-400 font-semibold">National Polytechnic Institute (NPI)</span>. 
              All rights reserved.
              <br />
              <a 
                href="https://shuvo-rozario.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#0186C0] transition-colors inline-flex items-center gap-1 mt-2"
              >
                <FontAwesomeIcon icon={faLink} className="text-[10px]" />
                <span>Developed by M.Shuvo Rozario</span>
              </a>
            </p>
          </aside>

          <div className="lg:hidden flex flex-row items-center justify-start md:justify-center gap-4 order-1 md:order-2">
            {[
              { href: socialLinks.facebookLink, path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" },
              { href: socialLinks.youtubeLink, path: "M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" },
              { href: socialLinks.linkedinLink, path: "M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.27c-.96 0-1.73-.78-1.73-1.73s.78-1.73 1.73-1.73 1.73.78 1.73 1.73-.78 1.73-1.73 1.73zm13.5 10.27h-3v-4.87c0-1.16-.04-2.65-1.61-2.65s-1.86 1.26-1.86 2.57v4.95h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.85-1.54 3.05 0 3.62 2.01 3.62 4.63v5.68z" },
              { href: socialLinks.twitterLink, path: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.61 1.798-1.574 2.166-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.722 0-4.928 2.205-4.928 4.927 0 .386.043.762.127 1.124-4.094-.206-7.725-2.168-10.161-5.151-.424.727-.667 1.571-.667 2.471 0 1.705.868 3.213 2.188 4.096-.806-.026-1.566-.247-2.228-.616v.062c0 2.382 1.693 4.371 3.946 4.821-.413.112-.848.172-1.296.172-.317 0-.626-.031-.928-.089.627 1.956 2.445 3.378 4.6 3.418-1.684 1.319-3.808 2.106-6.115 2.106-.397 0-.788-.023-1.173-.068 2.179 1.397 4.768 2.214 7.557 2.214 9.054 0 14.01-7.505 14.01-14.01l-.017-.638C22.505 6.4 23.34 5.543 24 4.557z" },
            ]
              .filter((item) => typeof item.href === "string" && item.href.trim() !== "" && item.href.trim() !== "#")
              .map((item, index) => (
                <SocialIcon key={index} href={item.href} path={item.path} />
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ href, path }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-gray-500 hover:text-[#0186C0] transform hover:-translate-y-2 transition-all duration-300 pr-4 py-2"
  >
    <svg className="fill-current w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d={path}></path>
    </svg>
  </a>
);

export default Footer;
