import { get, post, type ApiResponse } from './api'

// 单个 LLM 配置
export interface LLMConfigItem {
    provider: string
    api_key: string
    model: string
    base_url: string
    batch_size?: number
}

// 各提供商 API Key
export interface ProviderApiKeys {
    openai: string
    deepseek: string
    moonshot: string
    qwen: string
    hunyuan: string
    doubao: string
    zhipu: string
    anthropic: string
}

// 多模态配置响应
export interface MultiModalConfigResponse {
    content_analysis: LLMConfigItem
    image_analysis: LLMConfigItem
    video_analysis: LLMConfigItem
    provider_keys: ProviderApiKeys
    generate_count: number
}

// === 保存请求类型 ===

// 保存 API 配置请求
export interface SaveApiConfigRequest {
    content_analysis: {
        provider: string
        base_url: string
    }
    image_analysis: {
        provider: string
        base_url: string
    }
    video_analysis: {
        provider: string
        base_url: string
    }
    provider_keys: ProviderApiKeys
}

// 保存模型配置请求
export interface SaveModelConfigRequest {
    content_model: string
    image_model: string
    video_model: string
}

// 保存生成设置请求
export interface SaveGenerateConfigRequest {
    generate_count: number
}

// 获取 LLM 配置
export async function getLLMConfig(): Promise<ApiResponse<MultiModalConfigResponse>> {
    return get<MultiModalConfigResponse>('/settings/llm')
}

// 保存 API 配置（模块1）
export async function saveApiConfig(config: SaveApiConfigRequest): Promise<ApiResponse<{ message: string }>> {
    return post<{ message: string }>('/settings/api-config', config)
}

// 保存模型配置（模块2）
export async function saveModelConfig(config: SaveModelConfigRequest): Promise<ApiResponse<{ message: string }>> {
    return post<{ message: string }>('/settings/model-config', config)
}

// 保存生成设置（模块3）
export async function saveGenerateConfig(config: SaveGenerateConfigRequest): Promise<ApiResponse<{ message: string }>> {
    return post<{ message: string }>('/settings/generate-config', config)
}
