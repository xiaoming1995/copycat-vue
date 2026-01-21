import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLLMConfig, saveLLMConfig } from '../services/settings'

export type LLMProvider = 'openai' | 'deepseek' | 'anthropic' | 'moonshot' | 'qwen' | 'hunyuan' | 'doubao' | 'zhipu'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl: string
  batchSize: number
}

export interface MultiModalConfig {
  contentAnalysis: LLMConfig
  imageAnalysis: LLMConfig
  videoAnalysis: LLMConfig
}

export type ConfigTab = keyof MultiModalConfig

export const useSettingsStore = defineStore('settings', () => {
  const defaultLLMConfig: LLMConfig = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com/v1',
    batchSize: 1
  }

  const multiModalConfig = ref<MultiModalConfig>({
    contentAnalysis: { ...defaultLLMConfig },
    imageAnalysis: { ...defaultLLMConfig, model: 'gpt-4o' },
    videoAnalysis: { ...defaultLLMConfig, model: 'gpt-4o' }
  })

  const activeTab = ref<ConfigTab>('contentAnalysis')

  const isLoading = ref(false)
  const isSaving = ref(false)

  // 从后端加载配置
  async function fetchConfig(): Promise<boolean> {
    isLoading.value = true
    try {
      const response = await getLLMConfig()
      if (response.code === 0 && response.data) {
        // 加载三种配置
        multiModalConfig.value = {
          contentAnalysis: {
            provider: (response.data.content_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.content_analysis?.api_key || '',
            model: response.data.content_analysis?.model || 'gpt-3.5-turbo',
            baseUrl: response.data.content_analysis?.base_url || '',
            batchSize: response.data.content_analysis?.batch_size || 1
          },
          imageAnalysis: {
            provider: (response.data.image_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.image_analysis?.api_key || '',
            model: response.data.image_analysis?.model || 'gpt-4o',
            baseUrl: response.data.image_analysis?.base_url || '',
            batchSize: response.data.image_analysis?.batch_size || 1
          },
          videoAnalysis: {
            provider: (response.data.video_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.video_analysis?.api_key || '',
            model: response.data.video_analysis?.model || 'gpt-4o',
            baseUrl: response.data.video_analysis?.base_url || '',
            batchSize: response.data.video_analysis?.batch_size || 1
          }
        }
        return true
      }
      return false
    } catch (error) {
      console.error('获取配置失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 保存配置到后端
  async function saveConfig(): Promise<{ success: boolean; message: string }> {
    isSaving.value = true
    try {
      const response = await saveLLMConfig({
        content_analysis: {
          provider: multiModalConfig.value.contentAnalysis.provider,
          api_key: multiModalConfig.value.contentAnalysis.apiKey,
          model: multiModalConfig.value.contentAnalysis.model,
          base_url: multiModalConfig.value.contentAnalysis.baseUrl,
          batch_size: multiModalConfig.value.contentAnalysis.batchSize
        },
        image_analysis: {
          provider: multiModalConfig.value.imageAnalysis.provider,
          api_key: multiModalConfig.value.imageAnalysis.apiKey,
          model: multiModalConfig.value.imageAnalysis.model,
          base_url: multiModalConfig.value.imageAnalysis.baseUrl,
          batch_size: multiModalConfig.value.imageAnalysis.batchSize
        },
        video_analysis: {
          provider: multiModalConfig.value.videoAnalysis.provider,
          api_key: multiModalConfig.value.videoAnalysis.apiKey,
          model: multiModalConfig.value.videoAnalysis.model,
          base_url: multiModalConfig.value.videoAnalysis.baseUrl,
          batch_size: multiModalConfig.value.videoAnalysis.batchSize
        }
      })
      if (response.code === 0) {
        return { success: true, message: '配置保存成功' }
      }
      return { success: false, message: response.msg || '保存失败' }
    } catch (error) {
      console.error('保存配置失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    } finally {
      isSaving.value = false
    }
  }

  return {
    multiModalConfig,
    activeTab,
    isLoading,
    isSaving,
    fetchConfig,
    saveConfig
  }
})
