import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChevronDown, faEdit, faEnvelope, faGraduationCap, faCommentDots, faSignOutAlt, faBullhorn, faImages, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, memo } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const Admin_nav = ({ isMobileMenuOpen = false, setIsMobileMenuOpen, isMobile = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadAdmissions, setUnreadAdmissions] = useState(0);
    const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);
    const [unreadPFeedbacks, setUnreadPFeedbacks] = useState(0);
    const [isNoticeDropdownOpen, setIsNoticeDropdownOpen] = useState(true);
    const [isFeedbackDropdownOpen, setIsFeedbackDropdownOpen] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const response = await authFetch(`${API_BASE_URL}/unread-counts?t=${Date.now()}`, { cache: 'no-store' });
                const data = await response.json();
                if (!response.ok) {
                    console.warn('Unread counts fetch failed:', data);
                    return;
                }
                setUnreadAdmissions(data.unreadAdmissions || 0);
                setUnreadMessages(data.unreadMessages || 0);
                setUnreadFeedbacks(data.unreadFeedbacks || 0);
                setUnreadPFeedbacks(data.unreadParentFeedbacks || 0);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, []);

    const totalFeedbacks = unreadFeedbacks + unreadPFeedbacks;

    const handleLogout = () => {
        toast(({ closeToast }) => (
            <div className="p-2">
                <p className="font-semibold text-gray-800 text-sm">Logout from Panel?</p>
                <p className="text-[10px] text-gray-500 mb-3">You will need to login again to access.</p>
                <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg transition-colors hover:bg-gray-200" onClick={closeToast}>Cancel</button>
                    <button className="px-3 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded-lg shadow-sm transition-colors hover:bg-red-700" onClick={() => {
                        localStorage.removeItem("authToken");
                        navigate("/Login");
                        closeToast();
                    }}>Logout</button>
                </div>
            </div>
        ), { autoClose: false, closeButton: false });
    };

    const isActive = (path) => location.pathname === path;

    const styles = {
        sidebar: (mobile, open) => ({
            width: '260px',
            height: '100dvh',
            background: 'linear-gradient(180deg, #14161b 0%, #1e2027 55%, #24262d 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            position: mobile ? 'fixed' : 'sticky',
            top: 0,
            left: 0,
            boxShadow: mobile ? '8px 0 30px rgba(0,0,0,0.45)' : '4px 0 20px rgba(0,0,0,0.35)',
            zIndex: 1000,
            overflowY: 'auto',
            overscrollBehaviorY: 'contain',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            transform: mobile && !open ? 'translateX(-100%)' : 'translateX(0)',
            transition: mobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }),
        mobileCloseBtn: {
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
        },
        header: {
            padding: '24px 20px',
            borderBottom: '1px solid #2c2e35',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255,255,255,0.015)'
        },
        navLink: (active) => ({
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            color: active ? '#fff' : '#a8adb8',
            textDecoration: 'none',
            fontSize: '14.5px',
            fontWeight: active ? '600' : '500',
            gap: '12px',
            borderLeft: active ? '3px solid #0EA5E9' : '3px solid transparent',
            background: active ? 'linear-gradient(90deg, rgba(14,165,233,0.16), rgba(14,165,233,0.02))' : 'transparent',
            cursor: 'pointer',
            position: 'relative'
        }),
        badge: {
            background: 'linear-gradient(135deg, #f87171, #dc2626)',
            color: 'white',
            borderRadius: '20px',
            padding: '2px 7px',
            fontSize: '10.5px',
            fontWeight: '700',
            marginLeft: 'auto',
            minWidth: '19px',
            height: '19px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
            boxShadow: '0 0 0 2px rgba(220,38,38,0.18)',
        },
        dot: {
            fontSize: '6px',
            color: '#0EA5E9',
            marginLeft: 'auto',
            marginRight: '2px'
        },
        dropdownContent: {
            listStyle: 'none',
            padding: '6px 0 10px 45px',
            background: 'rgba(0,0,0,0.18)'
        },
        dropdownLink: (active) => ({
            color: active ? '#0EA5E9' : '#9aa0ab',
            textDecoration: 'none',
            fontSize: '13.5px',
            fontWeight: active ? '600' : '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: '15px'
        }),
        logoutSection: {
            marginTop: 'auto',
            padding: '18px 20px',
            borderTop: '1px solid #2c2e35',
            background: 'rgba(255,255,255,0.015)'
        },
        logoutBtn: {
            width: '100%',
            padding: '11px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '13.5px',
            boxShadow: '0 4px 10px rgba(220,38,38,0.25)'
        }
    };

    return (
        <div style={styles.sidebar(isMobile, isMobileMenuOpen)} className="admin-sidebar-wrapper">
            <style>{`
                .admin-nav-link { transition: all 0.25s ease !important; }
                .admin-nav-link:hover {
                    background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01)) !important;
                    color: #fff !important;
                    border-left: 3px solid #0EA5E9 !important;
                }
                .admin-drop-link { transition: color 0.2s ease; }
                .admin-drop-link:hover { color: #fff !important; }
                .pulse-badge { animation: pulseGlow 1.8s infinite; }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
                    70% { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
                    100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
                }
                .logout-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
                .chevron { transition: transform 0.25s ease; }
                .admin-mobile-close-btn:hover { background: rgba(255,255,255,0.16) !important; }
                .admin-mobile-close-btn:active { transform: scale(0.93); }
                @media (max-width: 1024px) {
                    .admin-sidebar-wrapper {
                        will-change: transform;
                        -webkit-backface-visibility: hidden;
                        backface-visibility: hidden;
                    }
                }
                @media (max-width: 480px) {
                    .admin-nav-link {
                        padding: 13px 18px !important;
                        font-size: 14px !important;
                    }
                }
            `}</style>

            {isMobile && (
                <button
                    style={styles.mobileCloseBtn}
                    className="admin-mobile-close-btn"
                    onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <FontAwesomeIcon icon={faTimes} style={{fontSize: '15px'}} />
                </button>
            )}

            <div style={styles.header}>
                <div style={{background: 'linear-gradient(135deg, #0EA5E9, #0186C0)', padding: '11px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(1, 134, 192, 0.35)'}}>
                    <FontAwesomeIcon icon={faUser} style={{color: 'white', fontSize: '19px'}} />
                </div>
                <div>
                    <h2 style={{fontSize: '17px', margin: 0, fontWeight: '800', color: 'white', letterSpacing: '0.4px'}}>Admin Panel</h2>
                    <span style={{fontSize: '10.5px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.8px'}}>Control Center</span>
                </div>
            </div>

            <nav style={{marginTop: '16px', flex: 1}}>
                <Link to="/Admin" style={styles.navLink(isActive("/Admin"))} className="admin-nav-link">
                    <FontAwesomeIcon icon={faEdit} /> Edit Website
                </Link>

                <Link to="/Admin/Admin_Banners" style={styles.navLink(isActive("/Admin/Admin_Banners"))} className="admin-nav-link">
                    <FontAwesomeIcon icon={faImages} /> Banners
                </Link>

                <div>
                    <div style={styles.navLink(false)} onClick={() => setIsNoticeDropdownOpen(!isNoticeDropdownOpen)} className="admin-nav-link">
                        <FontAwesomeIcon icon={faBullhorn} />
                        <span>Notice</span>
                        <FontAwesomeIcon icon={faChevronDown} className="chevron" style={{marginLeft: 'auto', fontSize: '11px', transform: isNoticeDropdownOpen ? 'rotate(180deg)' : 'none'}} />
                    </div>
                    {isNoticeDropdownOpen && (
                        <ul style={styles.dropdownContent}>
                            <li style={{marginBottom: '10px'}}>
                                <Link to="/Admin/Admin_Notie" style={styles.dropdownLink(isActive("/Admin/Admin_Notie"))} className="admin-drop-link">+ Add New Notice</Link>
                            </li>
                            <li>
                                <Link to="/Admin/All_Notice" style={styles.dropdownLink(isActive("/Admin/All_Notice"))} className="admin-drop-link">View All Notices</Link>
                            </li>
                        </ul>
                    )}
                </div>

                <Link to="/Admin/Messages" style={styles.navLink(isActive("/Admin/Messages"))} className="admin-nav-link">
                    <FontAwesomeIcon icon={faEnvelope} />
                    Messages
                    {unreadMessages > 0 && <span style={styles.badge} className="pulse-badge">{unreadMessages}</span>}
                </Link>

                <Link to="/Admin/Online_Admission_Admin" style={styles.navLink(isActive("/Admin/Online_Admission_Admin"))} className="admin-nav-link">
                    <FontAwesomeIcon icon={faGraduationCap} />
                    Admissions
                    {unreadAdmissions > 0 && <span style={styles.badge} className="pulse-badge">{unreadAdmissions}</span>}
                </Link>

                <div>
                    <div style={styles.navLink(false)} onClick={() => setIsFeedbackDropdownOpen(!isFeedbackDropdownOpen)} className="admin-nav-link">
                        <FontAwesomeIcon icon={faCommentDots} />
                        <span>Feedback</span>
                        {totalFeedbacks > 0 && <span style={styles.badge} className="pulse-badge">{totalFeedbacks}</span>}
                        <FontAwesomeIcon icon={faChevronDown} className="chevron" style={{marginLeft: totalFeedbacks > 0 ? '8px' : 'auto', fontSize: '11px', transform: isFeedbackDropdownOpen ? 'rotate(180deg)' : 'none'}} />
                    </div>
                    {isFeedbackDropdownOpen && (
                        <ul style={styles.dropdownContent}>
                            <li style={{marginBottom: '10px'}}>
                                <Link to="/Admin/Admin_Student_Feedback" style={styles.dropdownLink(isActive("/Admin/Admin_Student_Feedback"))} className="admin-drop-link">
                                    Students
                                    {unreadFeedbacks > 0 && <span style={styles.badge}>{unreadFeedbacks}</span>}
                                </Link>
                            </li>
                            <li>
                                <Link to="/Admin/Admin_Parents_Feedback" style={styles.dropdownLink(isActive("/Admin/Admin_Parents_Feedback"))} className="admin-drop-link">
                                    Parents
                                    {unreadPFeedbacks > 0 && <span style={styles.badge}>{unreadPFeedbacks}</span>}
                                </Link>
                            </li>
                        </ul>
                    )}
                </div>
            </nav>

            <div style={styles.logoutSection}>
                <Link to="/AccountSettings" style={{...styles.navLink(isActive("/AccountSettings")), padding: '10px 0', fontSize: '13.5px', border: 'none', marginBottom: '10px'}} className="admin-nav-link">
                    <FontAwesomeIcon icon={faUser} /> Account Settings
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn} className="logout-btn">
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
            </div>
        </div>
    );
};

Admin_nav.propTypes = {
    isMobileMenuOpen: PropTypes.bool,
    setIsMobileMenuOpen: PropTypes.func,
    isMobile: PropTypes.bool
};

export default memo(Admin_nav);