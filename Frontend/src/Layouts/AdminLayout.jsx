import { API_BASE_URL } from "../apiConfig";
import Admin_nav from "../Admin/Admin_Components/Admin_Nav/Admin_nav";
import { useEffect, useState } from "react";
import useHelmet from "../useHelmet";
import Loading from "../Components/Loading/Loading";
import { Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

const Adminlayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [routeTransitionLoading, setRouteTransitionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        let active = true;

        const initAos = async () => {
            try {
                const [{ default: Aos }] = await Promise.all([
                    import('aos'),
                    import('aos/dist/aos.css'),
                ]);
                if (active && Aos && Aos.init) {
                    Aos.init({ duration: 1500, offset: 10 });
                }
            } catch (error) {
                console.warn('AOS failed to load in admin layout', error);
            }
        };

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);

        const loadData = async () => {
            try {
                await fetchAllData();
            } catch {
                setError("Unable to sync with NPI servers.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

        initAos();

        return () => {
            active = false;
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const location = useLocation();
    useEffect(() => {
        setIsMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        let active = true;
        setRouteTransitionLoading(true);
        const routeTimeout = window.setTimeout(() => {
            if (active) setRouteTransitionLoading(false);
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(routeTimeout);
            setRouteTransitionLoading(false);
        };
    }, [location.pathname]);

    useEffect(() => {
        const handleOnline = () => {
            setError(null);
            setRouteTransitionLoading(false);
            setIsLoading(true);
            fetchAllData()
                .then(() => setIsLoading(false))
                .catch(() => {
                    setError("Unable to sync with NPI servers.");
                    setIsLoading(false);
                });
        };
        const handleOffline = () => {
            setError("Unable to sync with NPI servers.");
            setRouteTransitionLoading(false);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchAllData = async () => {
        const fetchJsonWithTimeout = (url, ms = 8000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), ms);
            return fetch(url, { signal: controller.signal }).then(res => {
                clearTimeout(id);
                if (!res.ok) throw new Error('http_error');
                return res.json();
            });
        };

        await fetchJsonWithTimeout(`${API_BASE_URL}/overview`);
    };

    const HelmetComponent = useHelmet("Admin-Panel");

    if (isLoading || routeTransitionLoading) return <Loading />;

    if (error) {
        const isMobile = windowWidth < 640;
        const s = {
            screen: {
                height: '100vh', width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', backgroundColor: '#fdfdfd', 
                background: 'radial-gradient(circle at top right, #f0f7ff 0%, #ffffff 100%)',
                fontFamily: "'Inter', sans-serif",
                padding: '20px', boxSizing: 'border-box'
            },
            card: {
                textAlign: 'center', 
                maxWidth: isMobile ? '100%' : '450px', 
                width: '100%',
                padding: isMobile ? '10px' : '20px'
            },
            iconBox: {
                position: 'relative', 
                width: isMobile ? '80px' : '100px', 
                height: isMobile ? '80px' : '100px', 
                margin: '0 auto 24px'
            },
            pulse: {
                position: 'absolute', inset: 0, borderRadius: '50%', 
                backgroundColor: 'rgba(1, 134, 192, 0.1)', animation: 'errorPulse 2s infinite'
            },
            title: {
                fontSize: isMobile ? '22px' : '28px', 
                fontWeight: '800', color: '#0f172a',
                letterSpacing: '-0.02em', marginBottom: '12px',
                lineHeight: '1.2'
            },
            desc: {
                fontSize: isMobile ? '13px' : '15px', 
                color: '#64748b', lineHeight: '1.6', marginBottom: '32px',
                padding: isMobile ? '0 10px' : '0'
            },
            btn: {
                padding: isMobile ? '12px 24px' : '14px 32px', 
                borderRadius: '50px', border: 'none',
                backgroundColor: '#1e293b', color: '#fff', 
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                width: isMobile ? '100%' : 'auto'
            }
        };

        return (
            <div style={s.screen}>
                <div style={s.card}>
                    <div style={s.iconBox}>
                        <div style={s.pulse}></div>
                        <div style={{
                            position: 'relative', width: '100%', height: '100%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                        }}>
                            <svg width={isMobile ? "30" : "40"} height={isMobile ? "30" : "40"} viewBox="0 0 24 24" fill="none" stroke="#0186C0" strokeWidth="1.5">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                            </svg>
                        </div>
                    </div>
                    <h1 style={s.title}>Connection Lost</h1>
                    <p style={s.desc}>
                        We cannot reach the institute network right now. 
                        Please ensure your internet is active and try refreshing.
                    </p>
                    <button 
                        style={s.btn} 
                        onClick={() => window.location.reload()}
                        onMouseOver={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.backgroundColor = '#000';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isMobile) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = '#1e293b';
                            }
                        }}
                    >
                        Refresh Connection
                    </button>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes errorPulse {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(1.8); opacity: 0; }
                    }
                `}} />
            </div>
        );
    }

    return (
        <div className="Admin_Layout">
            <HelmetComponent/>
            <style>{`
                .Admin_Layout {
                    height: 100dvh;
                    width: 100vw;
                    overflow: hidden;
                    background: #ffffff;
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    grid-template-rows: 100dvh;
                    position: relative;
                }
                .admin-main {
                    background: #ffffff;
                    color: #1f2937;
                    box-sizing: border-box;
                    width: 100%;
                    height: 100dvh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    position: relative;
                }
                .admin-mobile-header {
                    display: none;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background: linear-gradient(135deg, #0EA5E9 0%, #0186C0 100%);
                    padding: 12px 16px;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .admin-mobile-menu-btn {
                    background: rgba(255,255,255,0.15);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    backdrop-filter: blur(8px);
                }
                .admin-mobile-menu-btn:hover {
                    background: rgba(255,255,255,0.25);
                }
                .admin-mobile-menu-btn:active {
                    transform: scale(0.96);
                }
                .admin-mobile-title {
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    letter-spacing: 0.3px;
                    margin: 0;
                }
                .admin-mobile-subtitle {
                    color: rgba(255,255,255,0.8);
                    font-size: 10.5px;
                    font-weight: 600;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    margin: 0;
                }
                .admin-sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.25s ease, visibility 0.25s ease;
                    backdrop-filter: blur(2px);
                }
                .admin-sidebar-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                @media (max-width: 1024px) {
                    .Admin_Layout {
                        grid-template-columns: 1fr;
                        height: 100dvh;
                        overflow: hidden;
                    }
                    .admin-main {
                        padding: 0;
                        height: 100dvh;
                        overflow-y: auto;
                        overflow-x: hidden;
                    }
                    .admin-main > :global(.admin-page-content),
                    .admin-main > * {
                        padding-left: 12px;
                        padding-right: 12px;
                        padding-bottom: 20px;
                        box-sizing: border-box;
                    }
                    .admin-mobile-header {
                        display: flex;
                    }
                    .admin-sidebar-overlay {
                        display: block;
                    }
                }
                @media (max-width: 640px) {
                    .admin-main > :global(.admin-page-content),
                    .admin-main > * {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                }
            `}</style>

            {isMobileMenuOpen && (
                <div
                    className="admin-sidebar-overlay active"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Admin_nav
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isMobile={windowWidth < 1024}
            />

            <div className="admin-main">
                <div className="admin-mobile-header">
                    <button
                        className="admin-mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <FontAwesomeIcon icon={faBars} style={{fontSize: '18px'}} />
                    </button>
                    <div>
                        <h1 className="admin-mobile-title">Admin Panel</h1>
                        <p className="admin-mobile-subtitle">Control Center</p>
                    </div>
                </div>
                <Outlet/>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                theme="colored"
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                pauseOnHover
                draggable={false}
                limit={1}
                style={{ zIndex: 99999 }}
                toastClassName="admin-toast"
              />
        </div>
    );
};

export default Adminlayout;
