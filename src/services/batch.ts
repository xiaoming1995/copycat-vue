/**
 * 批量分析 API 服务
 */

import { getToken } from './api'

// 生产环境使用相对路径（通过 nginx 代理），开发环境使用 localhost
const API_BASE_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8088/api/v1'

export interface BatchAnalyzeRequest {
    urls: string[]
}

export interface BatchAnalyzeResponse {
    batch_id: string
    total_count: number
    status: string
}

export interface BatchProject {
    id: string
    source_url: string
    status: string
    title?: string
    error_message?: string
}

export interface BatchTaskStatus {
    batch_id: string
    total_count: number
    success_count: number
    failed_count: number
    status: string
    projects?: BatchProject[]
}

export interface BatchListResponse {
    list: BatchTaskStatus[]
    total: number
    page: number
    page_size: number
}

/**
 * 创建批量分析任务
 */
export async function createBatchAnalyze(urls: string[]): Promise<{ success: boolean; data?: BatchAnalyzeResponse; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ urls })
        })
        const result = await response.json()

        if (result.code === 0) {
            return { success: true, data: result.data }
        }
        return { success: false, message: result.msg || '创建任务失败' }
    } catch (error) {
        console.error('创建批量任务失败:', error)
        return { success: false, message: '网络错误，请稍后重试' }
    }
}

/**
 * 获取批量任务状态
 */
export async function getBatchStatus(batchId: string): Promise<{ success: boolean; data?: BatchTaskStatus; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/${batchId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        const result = await response.json()

        if (result.code === 0) {
            return { success: true, data: result.data }
        }
        return { success: false, message: result.msg || '获取状态失败' }
    } catch (error) {
        console.error('获取批量任务状态失败:', error)
        return { success: false, message: '网络错误，请稍后重试' }
    }
}

/**
 * 获取批量任务列表
 */
export async function listBatchTasks(page = 1, pageSize = 10): Promise<{ success: boolean; data?: BatchListResponse; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/batch/list?page=${page}&page_size=${pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        const result = await response.json()

        if (result.code === 0) {
            return { success: true, data: result.data }
        }
        return { success: false, message: result.msg || '获取列表失败' }
    } catch (error) {
        console.error('获取批量任务列表失败:', error)
        return { success: false, message: '网络错误，请稍后重试' }
    }
}
