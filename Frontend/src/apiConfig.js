import axios from 'axios';

const envApi = import.meta.env && import.meta.env.VITE_API_BASE_URL;

const defaultProd = 'https://npi.edu.bd/api';
const defaultDev = 'https://npi.edu.bd/api';

export const API_BASE_URL = (envApi && envApi.replace(/\/$/, '')) || (import.meta.env.DEV ? defaultDev : defaultProd);

export const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export function getAuthToken() {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

export function clearAuthAndRedirect() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
  } catch {}
  if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/Login')) {
    window.location.href = '/Login';
  }
}

export function placeholderImage(size) {
  let w = 300;
  let h = 300;
  if (size) {
    const s = String(size);
    const parts = s.toLowerCase().split('x');
    if (parts.length === 2) {
      w = parseInt(parts[0], 10) || 300;
      h = parseInt(parts[1], 10) || 300;
    } else {
      const n = parseInt(s, 10);
      if (n) { w = n; h = n; }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="${Math.round(w*0.04)}" y="${Math.round(h*0.04)}" width="${Math.round(w*0.92)}" height="${Math.round(h*0.92)}" fill="none" stroke="#cbd5e1" stroke-width="${Math.max(1,Math.round(w*0.006))}" stroke-dasharray="${Math.round(w*0.015)},${Math.round(w*0.008)}" rx="${Math.round(w*0.03)}"/><text x="50%" y="45%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${Math.max(12, Math.round(w*0.09))}" fill="#0186C0" letter-spacing="${Math.round(w*0.003)}">NPI</text><text x="50%" y="62%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="${Math.max(9, Math.round(w*0.042))}" fill="#64748b">National Polytechnic</text><text x="50%" y="72%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="${Math.max(8, Math.round(w*0.034))}" fill="#94a3b8">No image available</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const isObject = (body) => body !== null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer) && !(body instanceof ReadableStream);
  if (isObject(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    options = { ...options, body: JSON.stringify(options.body) };
  }
  return fetch(url, { ...options, headers }).then(async (res) => {
    if (res.status === 401) {
      clearAuthAndRedirect();
    }
    return res;
  });
}

const attachAuthHeaders = (config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

const handleAuthResponseError = (error) => {
  if (error && error.response && error.response.status === 401) {
    clearAuthAndRedirect();
  }
  return Promise.reject(error);
};

axios.interceptors.request.use(attachAuthHeaders, (error) => Promise.reject(error));
axios.interceptors.response.use((response) => response, handleAuthResponseError);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(attachAuthHeaders, (error) => Promise.reject(error));
apiClient.interceptors.response.use((response) => response, handleAuthResponseError);

export default axios;
