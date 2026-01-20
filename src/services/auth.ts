/**
 * 用户认证相关 API
 */

import { post, get, type ApiResponse } from './api'

// 用户信息类型
export interface User {
    id: number
    email: string
    nickname: string
    created_at: string
    updated_at: string
}

// 登录响应
export interface LoginResponse {
    token: string
    user: User
}

// 注册请求参数
export interface RegisterRequest {
    email: string
    password: string
    nickname?: string
}

// 登录请求参数
export interface LoginRequest {
    email: string
    password: string
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<void>> {
    return post<void>('/register', data)
}

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return post<LoginResponse>('/login', data)
}

/**
 * 获取当前用户信息
 */
export async function getProfile(): Promise<ApiResponse<User>> {
    return get<User>('/user/profile')
}
