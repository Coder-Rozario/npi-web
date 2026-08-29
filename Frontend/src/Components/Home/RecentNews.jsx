import { API_BASE_URL, placeholderImage } from "../../apiConfig";
import { useState, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { useLoadingManager } from "../Loading/LoadingManager";

const getNewsImageUrl = (photoPath) => {
  if (!photoPath) return placeholderImage('400x250');
  if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;

  const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

const NewsModal = ({ news, onClose }) => {
  if (!news) return null;

  return (
    <div className="modal-overlay" style={modalStyles.overlay} onClick={onClose}>
      <div className="modal-content" style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" style={modalStyles.closeBtn} onClick={onClose}>&times;</button>

        <div className="modal-scroll-area" style={modalStyles.scrollArea}>
          <img 
            src={getNewsImageUrl(news.image)} 
            alt={news.title} 
            className="modal-main-img"
            style={modalStyles.modalImg} 
          />
          <div className="modal-body" style={modalStyles.body}>
            <h2 className="modal-title" style={modalStyles.modalTitle}>{news.title}</h2>
            <div 
              className="html-content"
              style={modalStyles.htmlContent}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(news.details ? news.details.replace(/src=(['"])uploads\//g, `src=$1${API_BASE_URL}/uploads/`) : '')
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentNews = () => {
  const { markLoaded } = useLoadingManager();
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/news?t=${Date.now()}`, { 
          headers: { 'Cache-Control': 'no-cache' }
        });
        // Support multiple API response shapes: array, { data: [...] }, { news: [...] }
        const raw = response && response.data;
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.data)) list = raw.data;
        else if (raw && Array.isArray(raw.news)) list = raw.news;
        else if (raw && Array.isArray(raw.result)) list = raw.result;
        else list = [];
        setNewsData(list);
        console.log('Fetched news data:', list);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsData([]);
      } finally {
        setLoading(false);
        markLoaded("RecentNews");
      }
    };
    fetchNews();
  }, [markLoaded]);

  useEffect(() => {
    document.body.style.overflow = selectedNews ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedNews]);

  if (!loading && (!Array.isArray(newsData) || newsData.length === 0)) {
    return (
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h2 style={styles.title}>
              Recent News & <span style={{ color: '#0186C0' }}>Events</span>
            </h2>
            <div style={styles.underline}></div>
          </div>
          <div style={{textAlign: 'center', padding: '60px 20px', color: '#999'}}>
            <p>No news available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h2 style={styles.title}>
              Recent News & <span style={{ color: '#0186C0' }}>Events</span>
            </h2>
            <div style={styles.underline}></div>
          </div>
          <div style={{textAlign: 'center', padding: '60px 20px'}}>
            <p style={{color: '#0186C0', fontWeight: 'bold'}}>Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            Recent News & <span style={{ color: '#0186C0' }}>Events</span>
          </h2>
          <div style={styles.underline}></div>
        </div>

        <div style={styles.grid}>
          {Array.isArray(newsData) && newsData.length > 0 && newsData.map((news) => (
            <div
              key={news.id}
              style={styles.card}
              className="news-hover-card"
              onClick={() => setSelectedNews(news)}
            >
              <div style={styles.imgContainer}>
                <img src={getNewsImageUrl(news.image)} alt={news.title} loading="lazy" decoding="async" style={styles.cardImg} />
                <div style={styles.overlayEffect}></div>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{news.title}</h3>
                <div style={styles.readMoreContainer}>
                  <span style={styles.readMoreText}>Read Full Story</span>
                  <span style={styles.arrow}>&rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />

      <style>{`
        .news-hover-card { transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .news-hover-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .news-hover-card:hover img { transform: scale(1.08); }

        .html-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 15px 0;
          display: block;
        }

        /* Responsive Modal Fixes */
        @media (max-width: 768px) {
          .news-hover-card { margin: 0 10px; }
          .news-hover-card h3 { font-size: 1.25rem !important; }
          .news-hover-card span { font-size: 1rem !important; }

          .modal-overlay {
            padding: 10px !important;
          }

          .modal-content {
            width: 100% !important;
            max-height: calc(100vh - 20px) !important;
            border-radius: 16px !important;
          }

          .modal-body {
            padding: 20px !important;
          }

          .modal-title {
            font-size: 24px !important;
            margin-bottom: 15px !important;
            padding-right: 45px !important;
            line-height: 1.4 !important;
            font-weight: 800 !important;
          }

          .html-content {
            font-size: 1.1rem !important;
            line-height: 1.7 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            color: #374151 !important;
          }

          .modal-close-btn {
            top: 10px !important;
            right: 10px !important;
            width: 35px !important;
            height: 35px !important;
            font-size: 20px !important;
          }

          .modal-main-img {
            max-height: 250px !important;
          }
        }

        /* Modern Scrollbar for Modal */
        .modal-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll-area::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .modal-scroll-area::-webkit-scrollbar-thumb {
          background: #0186C0;
          border-radius: 10px;
        }
        .modal-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #0369A1;
        }
      `}</style>
    </section>
  );
};

const styles = {
  section: {
    padding: '80px 20px',
    backgroundColor: '#ffffff',
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px'
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 35px)',
    fontWeight: '800',
    color: '#111827',
    marginBottom: '15px'
  },
  underline: {
    width: '80px',
    height: '4px',
    backgroundColor: '#0186C0',
    margin: '0 auto',
    borderRadius: '2px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '30px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #f3f4f6',
    display: 'flex',
    flexDirection: 'column'
  },
  imgContainer: {
    position: 'relative',
    height: '220px',
    overflow: 'hidden'
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease'
  },
  cardBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: '1.4',
    marginBottom: '20px',
    minHeight: '56px'
  },
  readMoreContainer: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '15px',
    borderTop: '1px solid #f3f4f6'
  },
  readMoreText: {
    color: '#0186C0',
    fontWeight: '600',
    fontSize: '14px'
  },
  arrow: {
    color: '#0186C0',
    fontSize: '18px'
  },
  noData: {
    gridColumn: '1/-1',
    textAlign: 'center',
    padding: '50px',
    color: '#6b7280',
    fontSize: '18px'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '5px'
  },
  content: {
    backgroundColor: '#fff',
    width: '85%',
   
    maxHeight: 'calc(100vh - 40px)',
    borderRadius: '24px',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 30px 0',
    WebkitOverflowScrolling: 'touch'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  modalImg: {
    width: '100%',
    height: 'auto',
    maxHeight: '600px',
    display: 'block',
    objectFit: 'contain',
    backgroundColor: '#f9fafb'
  },
  body: {
    padding: '30px'
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    marginBottom: '20px'
  },
  htmlContent: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#4b5563',
    textAlign: 'justify'
  }
};

export default RecentNews;
