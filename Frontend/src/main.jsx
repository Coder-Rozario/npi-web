import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {RouterProvider} from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import { apiClient } from './apiConfig';
import router from './Routes';
import { registerServiceWorker } from './utils/serviceWorkerHelper';
import '../index.css'

const AUTH_TOKEN_KEY = 'authToken';

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (_) {
    return null;
  }
}

function redirectToLogin() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (_) {}
  if (window.location.pathname !== '/Login') {
    window.location.href = '/Login';
  }
}

// Use apiClient for attaching auth/handling 401/403 for API calls.
// The shared `apiClient` already adds the token to requests. Set up response handling here.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

const originalFetch = window.fetch.bind(window);
window.fetch = function (input, init) {
  const token = getAuthToken();
  if (token) {
    init = init || {};
    init.headers = init.headers || {};

    let headersObj;
    if (init.headers instanceof Headers) {
      headersObj = Object.fromEntries(init.headers.entries());
    } else if (Array.isArray(init.headers)) {
      headersObj = Object.fromEntries(init.headers);
    } else {
      headersObj = { ...init.headers };
    }
    if (!headersObj.Authorization && !headersObj.authorization) {
      headersObj.Authorization = `Bearer ${token}`;
    }
    init.headers = headersObj;
  }
  return originalFetch(input, init).then((response) => {
    if (response.status === 401 || response.status === 403) {

      const isLoginPage = typeof input === 'string'
        ? input.includes('/login')
        : input && input.url && input.url.includes('/login');
      if (!isLoginPage) {
        const path = window.location.pathname;
        if (!path.startsWith('/Login') && !path.startsWith('/login')) {

          response.clone().text().catch(() => {});

          const isApiCall = typeof input === 'string'
            ? input.includes('/api/')
            : input && input.url && input.url.includes('/api/');
          if (isApiCall) {
            redirectToLogin();
          }
        }
      }
    }
    return response;
  });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
    </HelmetProvider>
  </StrictMode>,
)

// Register service worker only for production builds and on secure origins.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerServiceWorker();
} else if ('serviceWorker' in navigator) {
  // Unregister any existing service worker during development.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
