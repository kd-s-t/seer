function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3016'
    }
    return `${protocol}//${hostname}/api`
  }
  return process.env.NEXT_PUBLIC_SEERY_BACKEND_DOMAIN || process.env.SEERY_BACKEND_DOMAIN || 'http://localhost:3016'
}

const API_BASE_URL = getApiBaseUrl()

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}
