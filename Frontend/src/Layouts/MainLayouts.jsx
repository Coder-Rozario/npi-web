import { API_BASE_URL } from "../apiConfig";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import Navbar from "../Components/Navbar/Navbar";
import BannerModal from "../Components/Banner/BannerModal";
import { useEffect, useState, useRef } from "react";
import useHelmet from "../useHelmet";
import Loading from "../Components/Loading/Loading";

const MainLayouts = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [routeTransitionLoading, setRouteTransitionLoading] = useState(false);
    const [webData, setWebData] = useState(() => {
        try {
            const cached = sessionStorage.getItem('webData');
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_) {
            return null;
        }
    });
    const [notices, setNotices] = useState(() => {
        try {
            const cached = sessionStorage.getItem('notices');
            if (!cached) return [];
            const parsed = JSON.parse(cached);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    });
    const [overview, setOverview] = useState(() => {
        try {
            const cached = sessionStorage.getItem('overview');
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_) {
            return null;
        }
    });
    const [error, setError] = useState(null);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const isInitialMount = useRef(true);

    useEffect(() => {
        let active = true;

        const initAos = async () => {
            try {
                const [{ default: Aos }] = await Promise.all([
                    import('aos'),
                    import('aos/dist/aos.css'),
                ]);
                if (active && Aos && Aos.init) {
                    Aos.init({ duration: 1600, offset: 100 });
                }
            } catch (error) {
                console.warn('AOS failed to load', error);
            }
        };

        const handleResize = () => setWindowWidth(window.innerWidth);
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

        const idlePrefetch = () => {
            const prewarm = [
                [`${API_BASE_URL}/authority`, 'authority_list'],
                [`${API_BASE_URL}/counters`, 'counters_data'],
                [`${API_BASE_URL}/videos`, 'videos_list'],
                [`${API_BASE_URL}/department`, 'department_list'],
                [`${API_BASE_URL}/get-feedback`, 'student_feedback'],
                [`${API_BASE_URL}/approved-parents-feedbacks`, 'parents_feedback'],
                [`${API_BASE_URL}/photos`, 'photos_list'],
            ];
            prewarm.forEach(([u, key]) => {
                fetch(u)
                    .then(res => res.json())
                    .then(data => {
                        if (active && data) sessionStorage.setItem(key, JSON.stringify(data));
                    })
                    .catch(() => {});
            });
        };

        const idleId = 'requestIdleCallback' in window
            ? window.requestIdleCallback(idlePrefetch, { timeout: 3000 })
            : window.setTimeout(idlePrefetch, 1800);

        initAos();

        return () => {
            active = false;
            window.removeEventListener('resize', handleResize);
            if ('cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            } else {
                window.clearTimeout(idleId);
            }
        };
    }, []);

    const location = useLocation();
    const navigationType = useNavigationType();
    const scrollPositions = useRef({});
    const prevPathRef = useRef(location.pathname);

    useEffect(() => {
        return () => {
            scrollPositions.current[prevPathRef.current] = window.scrollY;
            prevPathRef.current = location.pathname;
        };
    }, [location.pathname]);

    useEffect(() => {
        const main = document.getElementById('main-content');
        const isFirstMount = isInitialMount.current;
        if (isFirstMount) {
            isInitialMount.current = false;
        }

        if (navigationType === 'POP') {
            const savedScroll = scrollPositions.current[location.pathname];
            if (typeof savedScroll === 'number') {
                window.scrollTo({ top: savedScroll, behavior: 'auto' });
                if (main) main.scrollTo({ top: savedScroll, behavior: 'auto' });
            } else if (location.hash) {
                const targetId = location.hash.replace('#', '');
                setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
                }, 0);
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (isFirstMount) {
            return;
        }

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
    }, [location.pathname, navigationType]);

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
            return fetch(url, { signal: controller.signal, cache: 'no-store' }).then(res => {
                clearTimeout(id);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            });
        };

        const results = await Promise.allSettled([
            fetchJsonWithTimeout(`${API_BASE_URL}/get-web-data`),
            fetchJsonWithTimeout(`${API_BASE_URL}/get-notices?nocache=${Date.now()}`),
            fetchJsonWithTimeout(`${API_BASE_URL}/overview`),
        ]);

        if (results.every(r => r.status === 'rejected')) {
            throw new Error("All critical endpoints failed.");
        }

        if (results[0].status === 'fulfilled') {
            setWebData(results[0].value);
            sessionStorage.setItem('webData', JSON.stringify(results[0].value));
        }
        if (results[1].status === 'fulfilled') {
            setNotices(results[1].value);
            sessionStorage.setItem('notices', JSON.stringify(results[1].value));
        }
        if (results[2].status === 'fulfilled') {
            setOverview(results[2].value);
            sessionStorage.setItem('overview', JSON.stringify(results[2].value));
        }
    };

    const baseTitle = "National Polytechnic Institute (NPI)";
    const homeTitle = "National Polytechnic Institute (NPI) : Best Private Polytechnic Institute in Bangladesh";
    const routeTitles = {
        "/": "Home",
        "/About": "About",
        "/Profile": "Institutional Profile",
        "/Our_Dream": "Vision & Mission",
        "/Concession_for_students": "Scholarships",
        "/Controlling_Authority": "Controlling Authority",
        "/Short_Breif_of_Institute": "At a Glance",
        "/Departments": "Departments",
        "/Architecture_Engineering": "Architecture Engineering",
        "/Automobile_Engineering": "Automobile Engineering",
        "/Civil_Engineering": "Civil Engineering",
        "/Computer_Science_and_Technology": "Computer Technology",
        "/Electrical_Engineering": "Electrical Engineering",
        "/Electronics_Engineering": "Electronics Engineering",
        "/Mechanical_Engineering": "Mechanical Engineering",
        "/Food_Technology": "Food Technology",
        "/Textile_Engineering": "Textile Engineering",
        "/Academic": "Academic",
        "/Dhaka_Campus": "Dhaka Campus",
        "/Faridpur_Campus": "Faridpur Campus",
        "/Manikganj_Campus": "Manikganj Campus",
        "/Sonargaon_Campus": "BNIST, Sonargaon",
        "/Teacher_and_Staff": "Teacher & Staff",
        "/Teachers": "Teacher & Officer",
        "/Staff": "Administrative Staff",
        "/Online_Admission": "Online Admission",
        "/Notice": "Notice",
        "/Gallery": "Gallery",
        "/Images": "Photo Gallery",
        "/Activities": "Video Gallery",
        "/Contacts": "Contacts",
        "/Student_Feedback_Form": "Student Feedback",
        "/Parants_Feedback_Form": "Parents Feedback",
        "/Authority": "Authority"
    };
    const currentPath = location.pathname;
    let titleLabel = routeTitles[currentPath];
    if (!titleLabel) {
        const prefixKey = Object.keys(routeTitles).find(k => k !== "/" && currentPath.startsWith(k));
        titleLabel = prefixKey ? routeTitles[prefixKey] : "NPI";
    }
    const HelmetComponent = useHelmet(currentPath === "/" ? homeTitle : `${titleLabel} | ${baseTitle}`);

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
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <HelmetComponent />
            <Header webData={webData} />
            <Navbar />
            <BannerModal />
            <main id="main-content" style={{ flex: '1 0 auto', overflow: 'hidden' }}>
                <Outlet context={{ webData, notices, overview }} />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayouts;
