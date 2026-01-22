import { post, type ApiResponse } from './api'

// 标题分析结果
export interface TitleAnalysis {
    original: string
    hooks: string[]
    techniques: string[]
    score: number
}

// 情绪分析结果
export interface EmotionAnalysis {
    primary: string
    intensity: number
    tags: string[]
}

// 结构分析项
export interface StructureItem {
    title: string
    description: string
}

// 分析结果
export interface AnalysisResult {
    title_analysis?: TitleAnalysis
    emotion: EmotionAnalysis
    structure: StructureItem[]
    keywords: string[]
    tone: string
    word_count: number
}

// 单张图片分析结果
export interface ImageAnalysisItem {
    index: number
    composition: string   // 构图分析
    technique: string     // 拍摄手法
    highlight: string     // 视觉爆点
    color_tone: string    // 色调风格
    mood: string          // 情绪氛围
    image_prompt: string  // AI图像生成提示词
}

// 图片分析结果
export interface ImageAnalysisResult {
    images: ImageAnalysisItem[]
    overall_style: string     // 整体风格
    visual_strategy: string   // 视觉策略
}

// 分析请求
export interface AnalyzeRequest {
    title?: string
    content: string
    project_id?: string
    content_type?: 'text' | 'video' | 'images'  // 内容类型
}

// 图片分析请求
export interface AnalyzeImagesRequest {
    images: string[]
    project_id?: string
}

// 生成请求
export interface GenerateRequest {
    project_id: string
    new_topic: string
}

// 生成结果
export interface GenerateResult {
    generated_content: string
    generated_contents?: string[]  // 多条生成结果
}

// 分析爆款内容
export async function analyzeContent(data: AnalyzeRequest): Promise<ApiResponse<AnalysisResult>> {
    return post<AnalysisResult>('/analyze', data)
}

// 分析图片内容（多模态）
export async function analyzeImages(data: AnalyzeImagesRequest): Promise<ApiResponse<ImageAnalysisResult>> {
    return post<ImageAnalysisResult>('/analyze-images', data)
}

// 生成仿写文案
export async function generateContent(data: GenerateRequest): Promise<ApiResponse<GenerateResult>> {
    return post<GenerateResult>('/generate', data)
}
