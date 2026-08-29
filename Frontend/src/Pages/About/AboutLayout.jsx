import { API_BASE_URL } from '../../apiConfig';
import { MdVerified, MdLocationOn, MdBusiness, MdEmail, MdLanguage, MdPhoneInTalk } from 'react-icons/md';
import { FaFacebook, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

const styles = {
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '20px 15px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    position: 'sticky',
    top: '40px'
  },
  imageContainer: {
    margin: '0 auto 30px',
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(3, 105, 161, 0.15)'
  },
  iconBox: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    color: '#0186C0',
    fontSize: '20px',
    transition: 'all 0.3s ease'
  },
  statLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '2px'
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    wordBreak: 'break-word'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)',
    margin: '25px 0'
  }
};

const defaultInfoRows = [
  { icon: <MdBusiness />, label: 'Institution', value: 'National Polytechnic Institute' },
  { icon: <MdLocationOn />, label: 'Location', value: 'Loading...' },
  { icon: <MdEmail />, label: 'Email Address', value: 'Loading...' },
  { icon: <MdPhoneInTalk />, label: 'Contact', value: 'Loading...' },
  { icon: <MdLanguage />, label: 'Official Portal', value: 'www.npi.edu.bd' }
];

const defaultSocialLinks = [
  { icon: <FaFacebook />, link: '', color: '#1877F2' },
  { icon: <FaLinkedin />, link: '', color: '#0A66C2' },
  { icon: <FaTwitter />, link: '', color: '#1DA1F2' },
  { icon: <FaYoutube />, link: '', color: '#FF0000' }
];

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 group">
      <div style={styles.iconBox} className="group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200">
        {icon}
      </div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <p style={styles.statValue}>{value}</p>
      </div>
    </div>
  );
}

InfoRow.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  value: PropTypes.string
};

function SocialIcon({ icon, link, color }) {
  return (
    <a
      href={link}
      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all duration-300 hover:scale-110"
      onMouseEnter={(e) => { e.currentTarget.style.color = color; e.currentTarget.style.backgroundColor = `${color}10`; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
    >
      <span className="text-lg">{icon}</span>
    </a>
  );
}

SocialIcon.propTypes = {
  icon: PropTypes.node,
  link: PropTypes.string,
  color: PropTypes.string
};

const getImageUrl = (photoPath) => {
  if (!photoPath) return "/storage/photos/shares/15451150562222_copy.jpg";
  if (photoPath.startsWith("http") || photoPath.startsWith("data:") || photoPath.startsWith("blob:")) return photoPath;

  const cleanPath = photoPath.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

const AboutLayout = ({
  content,
  photo,
  title = 'NPI Dhaka',
  subtitle,
  infoRows,
  socialLinks
}) => {
  const [dbRows, setDbRows] = useState(defaultInfoRows);
  const [dbSocials, setDbSocials] = useState(defaultSocialLinks);
  const sanitizeAndOptimize = (html) => {
    return DOMPurify.sanitize(html || "")
      .replace(/<img\b/gi, '<img loading="lazy" decoding="async"')
      .replace(/<video\b/gi, '<video preload="metadata"')
      .replace(/<a\b/gi, '<a rel="noopener noreferrer"');
  };

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/contact`);
        if (res.ok) {
          const data = await res.json();
          const rowsFromDb = [
            { icon: <MdBusiness />, label: 'Institution', value: 'National Polytechnic Institute' },
            { icon: <MdLocationOn />, label: 'Location', value: data.address || '' },
            { icon: <MdEmail />, label: 'Email Address', value: data.email || '' },
            { icon: <MdPhoneInTalk />, label: 'Contact', value: data.phone || '' },
            { icon: <MdLanguage />, label: 'Official Portal', value: 'www.npi.edu.bd' }
          ];
          setDbRows(rowsFromDb);
        }
      } catch {
        setDbRows(defaultInfoRows);
      }
    };

    const fetchSocial = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get-web-data`);
        if (res.ok) {
          const d = await res.json();
          const socialsFromDb = [
            { icon: <FaFacebook />, link: d.facebookLink || '', color: '#1877F2' },
            { icon: <FaLinkedin />, link: d.linkedinLink || '', color: '#0A66C2' },
            { icon: <FaTwitter />, link: d.twitterLink || '', color: '#1DA1F2' },
            { icon: <FaYoutube />, link: d.youtubeLink || '', color: '#FF0000' }
          ].filter(s => !!s.link);
          setDbSocials(socialsFromDb.length ? socialsFromDb : []);
        }
      } catch {
        setDbSocials([]);
      }
    };

    fetchContact();
    fetchSocial();
  }, []);

  const rows = useMemo(() => (infoRows && infoRows.length ? infoRows : dbRows), [infoRows, dbRows]);
  const socials = useMemo(() => (socialLinks && socialLinks.length ? socialLinks : dbSocials), [socialLinks, dbSocials]);

  return (
    <div className="bg-[#fcfdfe] min-h-screen ">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[380px]">
            <div style={styles.sidebarCard}>
              <div style={styles.imageContainer} className="group">
                <img
                  src={getImageUrl(photo)}
                  alt={subtitle || title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                  {title} <MdVerified style={{ color: '#0186C0' }} />
                </h2>
                {subtitle ? (
                  <p style={{ color: '#0186C0' }} className="font-semibold text-xs mt-1 tracking-wider uppercase">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <div style={styles.divider}></div>
              <div className="space-y-5">
                {rows.map((r, idx) => (
                  <InfoRow key={idx} icon={r.icon} label={r.label} value={r.value} />
                ))}
              </div>
              <div style={styles.divider}></div>
              <div className="flex justify-center gap-4">
                {socials.map((s, idx) => (
                  <SocialIcon key={idx} icon={s.icon} link={s.link} color={s.color} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-[40px] p-6 md:p-14 shadow-sm border border-slate-50">
            <style>{`
              .dynamic-about-content {
                line-height: 1.8;
                color: #475569;
                font-size: 1.05rem;
              }
              .dynamic-about-content h1,
              .dynamic-about-content h2,
              .dynamic-about-content h3 {
                color: #0f172a;
                font-weight: 900;
                margin-top: 2.5rem;
                margin-bottom: 1.25rem;
                letter-spacing: -0.02em;
                line-height: 1.2;
              }
              .dynamic-about-content h1 { font-size: 2.25rem; }
              .dynamic-about-content h2 { font-size: 1.85rem; }
              .dynamic-about-content h3 { font-size: 1.5rem; }
              .dynamic-about-content p {
                margin-bottom: 1.5rem;
                text-align: justify;
              }
              .dynamic-about-content b,
              .dynamic-about-content strong {
                color: #1e293b;
                font-weight: 700;
              }
              .dynamic-about-content table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 2.5rem 0;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
              }
              .dynamic-about-content th {
                background-color: #f8fafc;
                color: #64748b;
                padding: 1.25rem 1.5rem;
                text-align: left;
                font-size: 0.75rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-bottom: 1px solid #e2e8f0;
              }
              .dynamic-about-content td {
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.95rem;
                font-weight: 500;
                color: #334155;
              }
            `}</style>
            <div className="dynamic-about-content" dangerouslySetInnerHTML={{ __html: sanitizeAndOptimize(content) }} />
          </div>
        </div>
      </div>
    </div>
  );
};

AboutLayout.propTypes = {
  content: PropTypes.string,
  photo: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  infoRows: PropTypes.array,
  socialLinks: PropTypes.array
};

export default AboutLayout;
