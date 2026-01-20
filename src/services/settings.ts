import { get, post, type ApiResponse } from './api'

// 单个 LLM 配置
export interface LLMConfigItem {
    provider: string
    api_key: string
    model: string
    base_url: string
}

// 多模态配置
export interface MultiModalConfig {
    content_analysis: LLMConfigItem  // 文案分析
    image_analysis: LLMConfigItem    // 图片分析
    video_analysis: LLMConfigItem    // 视频分析
}

// 获取 LLM 配置
export async function getLLMConfig(): Promise<ApiResponse<MultiModalConfig>> {
    return get<MultiModalConfig>('/settings/llm')
}

// 保存 LLM 配置
export async function saveLLMConfig(config: MultiModalConfig): Promise<ApiResponse<{ message: string }>> {
    return post<{ message: string }>('/settings/llm', config)
}
