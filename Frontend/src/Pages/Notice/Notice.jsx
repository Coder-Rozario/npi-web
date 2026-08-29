import { API_BASE_URL, BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faCalendarAlt, faFileAlt, faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const noticesPerPage = 10;

  const fetchNotices = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? `${API_BASE_URL}/get-notices?nocache=${Date.now()}` : `${API_BASE_URL}/get-notices`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      setNotices(data);
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const sanitizeFileName = (text) => {
    const cleaned = (text || 'notice')
      .toString()
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_\-()&.\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const withoutExtension = cleaned.replace(/\.[a-zA-Z0-9]{1,5}$/g, '');
    const limited = (withoutExtension || 'notice').slice(0, 55).trim() || 'notice';
    return limited.replace(/[._-]+$/g, '') || 'notice';
  };

  const getFileExtension = (fileUrl) => {
    if (!fileUrl) return '';
    const path = fileUrl.split('?')[0];
    const match = path.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const buildDownloadFileName = (title, fileUrl) => {
    const fallbackName = getFileName(fileUrl) || 'notice';
    const baseName = sanitizeFileName(title || fallbackName);
    const extension = getFileExtension(fileUrl);
    return extension ? `${baseName}.${extension}` : baseName;
  };

  const resolveFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const baseUrl = BASE_URL || (import.meta.env.DEV ? 'https://npi.edu.bd/api' : 'https://npi.edu.bd');
    const cleanedPath = fileUrl.replace(/^\/+/, '');
    return `${baseUrl}/${cleanedPath}`;
  };

  const handleDownload = async (notice) => {
    if (!notice) return;

    const fileUrl = notice.fileUrl || notice.file_path || '';
    const title = notice.title || getFileName(fileUrl) || 'notice';
    const fileName = buildDownloadFileName(title, fileUrl);
    const staticFileUrl = fileUrl ? resolveFileUrl(fileUrl) : '';
    const apiDownloadUrl = notice && notice.id ? `${API_BASE_URL}/download-notice/${notice.id}` : staticFileUrl;

    const downloadBlob = async (url) => {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    };

    try {
      await downloadBlob(apiDownloadUrl);
      return;
    } catch (err) {
      console.error('Download via API failed:', err);
    }

    if (staticFileUrl && staticFileUrl !== apiDownloadUrl) {
      try {
        await downloadBlob(staticFileUrl);
        return;
      } catch (err) {
        console.error('Static file fallback failed:', err);
      }
    }

    console.error('Notice download failed for both API and static file paths.');
  };

  const getFileName = (fileUrl) => {
    if (!fileUrl) return '';
    try {
      const s = fileUrl.split('/').pop().split('?')[0];
      return decodeURIComponent(s);
    } catch {
      return fileUrl;
    }
  };

  const isImageFile = (fileUrl) => {
    if (!fileUrl) return false;
    const ext = (fileUrl.split('.').pop() || '').split('?')[0].toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(filteredNotices.length / noticesPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 bg-white">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
          Notice <span className="text-blue-600">Board</span>
        </h2>

        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 pl-12 focus:border-blue-600 focus:bg-white focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="block md:hidden space-y-4">
        {currentNotices.length > 0 ? (
          currentNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                  {formatDate(notice.uploaded_at)}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-relaxed mb-4">
                {notice.title || getFileName(notice.fileUrl)}
              </h3>
              <button
                onClick={() => handleDownload(notice)}
                className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Notice
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">
              {searchQuery ? `No notices found for "${searchQuery}"` : "Loading notices..."}
            </p>
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest w-1/2">
                <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                Notice Title
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentNotices.length > 0 ? (
              currentNotices.map((notice) => (
                <tr key={notice.id} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-600">{formatDate(notice.uploaded_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faFileAlt} className="text-slate-400" />
                      <p className="text-sm text-slate-700 font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {notice.title || getFileName(notice.fileUrl)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDownload(notice)}
                      className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-slate-900 text-white text-xs font-bold rounded-full transition-all duration-300 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-slate-400 font-medium italic">
                   {searchQuery ? `No notices found matching "${searchQuery}"` : "Loading notices..."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <p className="text-[12px] md:text-sm text-slate-500 font-medium order-2 md:order-1">
          Showing <span className="text-slate-900">{indexOfFirstNotice + 1}</span> to{" "}
          <span className="text-slate-900">{Math.min(indexOfLastNotice, filteredNotices.length)}</span> of{" "}
          <span className="text-slate-900">{filteredNotices.length}</span> notices
        </p>

        <div className="flex items-center gap-3 order-1 md:order-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 active:bg-slate-100 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>

          <div className="flex items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm font-bold text-blue-600">{currentPage}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-sm font-bold text-blue-600">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 active:bg-slate-100 transition-all"
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notice;
