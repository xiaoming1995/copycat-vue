/**
 * API 基础配置
 * 封装 HTTP 请求的通用逻辑
 */

// 生产环境使用相对路径（通过 nginx 代理），开发环境使用 localhost
const API_BASE_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8088/api/v1'

// 通用响应类型
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

// 获取存储的 Token
export function getToken(): string | null {
  return localStorage.getItem('token')
}

// 存储 Token
export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

// 清除 Token
export function clearToken(): void {
  localStorage.removeItem('token')
}

// 通用请求方法
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // 自动添加 Authorization header
  const token = getToken()
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data: ApiResponse<T> = await response.json()

    // 处理认证失败
    if (data.code === 401) {
      clearToken()
      window.location.href = '/login'
      throw new Error('认证失败，请重新登录')
    }

    return data
  } catch (error) {
    console.error('API 请求失败:', error)
    throw error
  }
}

// GET 请求
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'GET' })
}

// POST 请求
export async function post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

// PUT 请求
export async function put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

// DELETE 请求
export async function del<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export { API_BASE_URL }
