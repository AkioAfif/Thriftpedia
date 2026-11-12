export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// browser goes through the same-origin /api rewrite (backend has no CORS); server calls the API directly
const API_BASE_URL =
  typeof window !== 'undefined'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      0,
      'Unable to connect to the server. Please check your connection.'
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 400) {
      const message =
        data?.message || 'Invalid request. Please check your inputs.';
      throw new ApiError(400, message, data);
    }
    if (response.status === 404) {
      throw new ApiError(404, data?.message || 'Resource not found.', data);
    }
    if (response.status >= 500) {
      throw new ApiError(
        response.status,
        'Server error occurred. Please try again later.',
        data
      );
    }
    throw new ApiError(
      response.status,
      data?.message || `Request failed with status ${response.status}`,
      data
    );
  }

  return data;
}
