function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SEERY_BACKEND_DOMAIN || ''
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
