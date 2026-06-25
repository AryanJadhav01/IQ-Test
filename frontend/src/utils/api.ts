let BASE_URL = 'http://localhost:5000/api';

if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  BASE_URL = `http://${host}:5000/api`;
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Inject JWT if stored
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cs_iq_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Attempt parsing JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data?.error || data || `HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[API Error] Request failed for ${endpoint}:`, error.message || error);
    throw error;
  }
}

export const api = {
  get: (endpoint: string, headers?: Record<string, string>) => 
    request(endpoint, { method: 'GET', headers }),
    
  post: (endpoint: string, body: any, headers?: Record<string, string>) => 
    request(endpoint, { method: 'POST', body, headers }),
    
  put: (endpoint: string, body: any, headers?: Record<string, string>) => 
    request(endpoint, { method: 'PUT', body, headers }),
    
  delete: (endpoint: string, headers?: Record<string, string>) => 
    request(endpoint, { method: 'DELETE', headers }),
};
