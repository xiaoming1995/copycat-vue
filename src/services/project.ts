/**
 * 项目管理相关 API
 */

import { get, post, put, del, type ApiResponse } from './api'

// 项目状态
export type ProjectStatus = 'draft' | 'analyzed' | 'completed'

// 项目类型
export interface Project {
    id: string
    user_id: number
    source_url?: string
    source_content: string
    content_type?: 'text' | 'images' | 'video'  // 内容类型
    analysis_result?: Record<string, unknown>
    new_topic?: string
    generated_content?: string
    status: ProjectStatus
    created_at: string
    updated_at: string
}

// 项目列表响应
export interface ProjectListResponse {
    list: Project[]
    total: number
    page: number
    page_size: number
}

// 创建项目请求
export interface CreateProjectRequest {
    source_url?: string
    source_content: string
}

// 更新项目请求
export interface UpdateProjectRequest {
    source_url?: string
    source_content?: string
    new_topic?: string
    generated_content?: string
    status?: ProjectStatus
}

/**
 * 创建项目
 */
export async function createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return post<Project>('/projects', data)
}

/**
 * 获取项目列表
 */
export async function getProjects(page = 1, pageSize = 10): Promise<ApiResponse<ProjectListResponse>> {
    return get<ProjectListResponse>(`/projects?page=${page}&page_size=${pageSize}`)
}

/**
 * 获取项目详情
 */
export async function getProject(id: string): Promise<ApiResponse<Project>> {
    return get<Project>(`/projects/${id}`)
}

/**
 * 更新项目
 */
export async function updateProject(id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return put<Project>(`/projects/${id}`, data)
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<ApiResponse<void>> {
    return del<void>(`/projects/${id}`)
}

/**
 * 检查链接是否已有分析结果
 */
export async function checkProjectByURL(url: string): Promise<ApiResponse<Project | null>> {
    return get<Project | null>(`/projects/check?url=${encodeURIComponent(url)}`)
}

/**
 * 批量删除项目
 */
export async function batchDeleteProjects(ids: string[]): Promise<ApiResponse<{ deleted_count: number; message: string }>> {
    return del<{ deleted_count: number; message: string }>('/projects/batch', { ids })
}
