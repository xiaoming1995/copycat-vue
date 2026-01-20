/**
 * 爬虫相关 API
 */

import { post, type ApiResponse } from './api'

// 视频信息
export interface VideoInfo {
    url?: string
    cover_url?: string
    duration?: number
}

// 爬取的笔记内容
export interface NoteContent {
    note_id: string
    title: string
    content: string
    type: 'normal' | 'video'
    cover_url?: string
    author_id: string
    author_name: string
    author_avatar?: string
    images?: string[]
    video?: VideoInfo
    tags?: string[]
    like_count: number
    comment_count: number
    collect_count: number
    share_count: number
    publish_time?: string
    crawl_time: string
    source_url: string
}

// 爬取响应
export interface CrawlResponse {
    success: boolean
    platform: string
    content?: NoteContent
    error?: string
}

// 爬取请求
export interface CrawlRequest {
    url: string
}

/**
 * 爬取小红书内容
 */
export async function crawlUrl(url: string): Promise<ApiResponse<CrawlResponse>> {
    return post<CrawlResponse>('/crawl', { url })
}
