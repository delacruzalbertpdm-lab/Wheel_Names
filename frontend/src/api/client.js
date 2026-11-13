/**
 * Clean REST API HTTP client decoupled from backend implementation details.
 */

// Determine API URL:
// 1. If VITE_API_BASE_URL is set to a remote URL (e.g. on Render), use it.
// 2. In production or default, use relative '/api' so it calls the same host.
const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const isLocalhostUrl = rawApiUrl.includes('127.0.0.1') || rawApiUrl.includes('localhost');

const API_BASE_URL = (
  !import.meta.env.DEV && isLocalhostUrl
    ? '/api'
    : (rawApiUrl || '/api')
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    const isDev = import.meta.env.DEV;
    const msg = isDev
      ? 'Unable to connect to the PulseDraw backend server. Please verify the Django server is running on port 8000.'
      : `Unable to connect to backend server at "${url}". Please verify the Django backend is running and reachable.`;
    throw new ApiError(msg, 0, null);
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
    if (data) {
      if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          errorMessage = String(firstVal[0]);
        } else if (typeof firstVal === 'string') {
          errorMessage = firstVal;
        }
      }
    }
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

