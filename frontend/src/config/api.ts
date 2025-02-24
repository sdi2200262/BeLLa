export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.VITE_API_URL 
  : 'http://localhost:3001/api';

/**
 * Default fetch options optimized for our backend
 */
export const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': process.env.NODE_ENV === 'production' 
      ? (process.env.VITE_FRONTEND_URL || '') 
      : 'http://localhost:3000'
  } as HeadersInit,
  // Add timeout to all requests
  signal: AbortSignal.timeout(30000) // 30 second timeout
};

/**
 * Create headers with auth token
 */
export const createAuthHeaders = (token?: string): RequestInit => ({
  ...defaultFetchOptions,
  headers: {
    ...defaultFetchOptions.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  } as HeadersInit
});

/**
 * API Error Handler
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Handle API Response
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || error.error || 'API request failed',
      response.status,
      error.code
    );
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new APIError('Invalid JSON response from server');
  }
} 