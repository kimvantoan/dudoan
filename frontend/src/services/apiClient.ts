const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function request(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage if in browser environment
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Đã có lỗi xảy ra');
  }

  return result;
}
