export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Safe fetch wrapper that handles content-type and Codespaces HTML errors.
 */
export async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const contentType = res.headers.get('content-type');
    
    // If the response is not JSON, it's likely a proxy error or wrong URL returning HTML
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('API Error: Expected JSON but received:', text.slice(0, 200));
      return { 
        ok: false, 
        error: 'Backend URL is wrong or server is not reachable. Check your environment variables.',
        status: res.status
      };
    }

    const data = await res.json();
    
    if (!res.ok) {
      return { 
        ok: false, 
        error: data.error || data.message || `Request failed with status ${res.status}`,
        status: res.status 
      };
    }

    return { ok: true, data };
  } catch (e) {
    console.error('SafeFetch Exception:', e);
    const isCodespace = typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev');
    let errorMsg = 'Failed to connect to the backend. Please ensure the server is running on port 3001.';
    
    if (isCodespace && API_BASE_URL.includes('localhost')) {
      errorMsg += ' HINT: You are in a Codespace but using localhost for API. Update NEXT_PUBLIC_API_URL to your Codespace HTTPS URL.';
    }
    
    return { 
      ok: false, 
      error: errorMsg
    };
  }
}

/**
 * Generate a simple idempotency key using crypto.randomUUID()
 * Optional prefix can be provided for better debugging.
 */
export function generateIdempotencyKey(prefix: string = 'key'): string {
  let uuid: string;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    uuid = window.crypto.randomUUID();
  } else {
    uuid = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return `${prefix}_${uuid}`;
}
