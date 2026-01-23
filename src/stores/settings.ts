import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLLMConfig, saveApiConfig, saveModelConfig, saveGenerateConfig, saveTaskType } from '../services/settings'

export type LLMProvider = 'openai' | 'deepseek' | 'anthropic' | 'moonshot' | 'qwen' | 'hunyuan' | 'doubao' | 'zhipu'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl: string
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

export interface MultiModalConfig {
  contentAnalysis: LLMConfig
  imageAnalysis: LLMConfig
  videoAnalysis: LLMConfig
  speechSynthesis: LLMConfig
}

export type ConfigTab = keyof MultiModalConfig

export const useSettingsStore = defineStore('settings', () => {
  const defaultLLMConfig: LLMConfig = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com/v1'
  }

  const multiModalConfig = ref<MultiModalConfig>({
    contentAnalysis: { ...defaultLLMConfig },
    imageAnalysis: { ...defaultLLMConfig, model: 'gpt-4o' },
    videoAnalysis: { ...defaultLLMConfig, model: 'gpt-4o' },
    speechSynthesis: { ...defaultLLMConfig, model: 'tts-1' }
  })

  // 各提供商 API Key
  const providerKeys = ref<ProviderApiKeys>({
    openai: '',
    deepseek: '',
    moonshot: '',
    qwen: '',
    hunyuan: '',
    doubao: '',
    zhipu: '',
    anthropic: ''
  })

  // 生成设置
  const generateCount = ref(1)

  const activeTab = ref<ConfigTab>('contentAnalysis')

  const isLoading = ref(false)
  const isSaving = ref(false)

  // 从后端加载配置
  async function fetchConfig(): Promise<boolean> {
    isLoading.value = true
    try {
      const response = await getLLMConfig()
      if (response.code === 0 && response.data) {
        // 加载各提供商 API Key
        if (response.data.provider_keys) {
          providerKeys.value = {
            openai: response.data.provider_keys.openai || '',
            deepseek: response.data.provider_keys.deepseek || '',
            moonshot: response.data.provider_keys.moonshot || '',
            qwen: response.data.provider_keys.qwen || '',
            hunyuan: response.data.provider_keys.hunyuan || '',
            doubao: response.data.provider_keys.doubao || '',
            zhipu: response.data.provider_keys.zhipu || '',
            anthropic: response.data.provider_keys.anthropic || ''
          }
        }

        // 加载生成设置
        generateCount.value = response.data.generate_count || 1

        // 加载三种配置
        multiModalConfig.value = {
          contentAnalysis: {
            provider: (response.data.content_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.content_analysis?.api_key || '',
            model: response.data.content_analysis?.model || 'gpt-3.5-turbo',
            baseUrl: response.data.content_analysis?.base_url || ''
          },
          imageAnalysis: {
            provider: (response.data.image_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.image_analysis?.api_key || '',
            model: response.data.image_analysis?.model || 'gpt-4o',
            baseUrl: response.data.image_analysis?.base_url || ''
          },
          videoAnalysis: {
            provider: (response.data.video_analysis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.video_analysis?.api_key || '',
            model: response.data.video_analysis?.model || 'gpt-4o',
            baseUrl: response.data.video_analysis?.base_url || ''
          },
          speechSynthesis: {
            provider: (response.data.speech_synthesis?.provider as LLMProvider) || 'openai',
            apiKey: response.data.speech_synthesis?.api_key || '',
            model: response.data.speech_synthesis?.model || 'tts-1',
            baseUrl: response.data.speech_synthesis?.base_url || ''
          }
        }

        // 加载默认选中的任务类型
        if (response.data.default_task_type) {
          activeTab.value = response.data.default_task_type as ConfigTab
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

  // 保存 API 配置（模块1）
  async function saveApiConfigAction(): Promise<{ success: boolean; message: string }> {
    isSaving.value = true
    try {
      const response = await saveApiConfig({
        content_analysis: {
          provider: multiModalConfig.value.contentAnalysis.provider,
          base_url: multiModalConfig.value.contentAnalysis.baseUrl
        },
        image_analysis: {
          provider: multiModalConfig.value.imageAnalysis.provider,
          base_url: multiModalConfig.value.imageAnalysis.baseUrl
        },
        video_analysis: {
          provider: multiModalConfig.value.videoAnalysis.provider,
          base_url: multiModalConfig.value.videoAnalysis.baseUrl
        },
        speech_synthesis: {
          provider: multiModalConfig.value.speechSynthesis.provider,
          base_url: multiModalConfig.value.speechSynthesis.baseUrl
        },
        provider_keys: providerKeys.value
      })
      if (response.code === 0) {
        return { success: true, message: 'API 配置保存成功' }
      }
      return { success: false, message: response.msg || '保存失败' }
    } catch (error) {
      console.error('保存失败:', error)
      return { success: false, message: '网络错误' }
    } finally {
      isSaving.value = false
    }
  }

  // 保存模型配置（模块2）
  async function saveModelConfigAction(): Promise<{ success: boolean; message: string }> {
    isSaving.value = true
    try {
      const response = await saveModelConfig({
        content_model: multiModalConfig.value.contentAnalysis.model,
        content_provider: multiModalConfig.value.contentAnalysis.provider,
        image_model: multiModalConfig.value.imageAnalysis.model,
        image_provider: multiModalConfig.value.imageAnalysis.provider,
        video_model: multiModalConfig.value.videoAnalysis.model,
        video_provider: multiModalConfig.value.videoAnalysis.provider,
        speech_model: multiModalConfig.value.speechSynthesis.model,
        speech_provider: multiModalConfig.value.speechSynthesis.provider
      })
      if (response.code === 0) {
        return { success: true, message: '模型配置保存成功' }
      }
      return { success: false, message: response.msg || '保存失败' }
    } catch (error) {
      console.error('保存失败:', error)
      return { success: false, message: '网络错误' }
    } finally {
      isSaving.value = false
    }
  }

  // 保存生成设置（模块3）
  async function saveGenerateConfigAction(): Promise<{ success: boolean; message: string }> {
    isSaving.value = true
    try {
      const response = await saveGenerateConfig({
        generate_count: generateCount.value
      })
      if (response.code === 0) {
        return { success: true, message: '生成设置保存成功' }
      }
      return { success: false, message: response.msg || '保存失败' }
    } catch (error) {
      console.error('保存失败:', error)
      return { success: false, message: '网络错误' }
    } finally {
      isSaving.value = false
    }
  }

  // 保存任务类型（模块1后端同步）
  async function saveTaskTypeAction(taskType?: string): Promise<{ success: boolean; message: string }> {
    isSaving.value = true
    try {
      const typeToSave = taskType || activeTab.value
      const response = await saveTaskType(typeToSave)
      if (response.code === 0) {
        if (taskType) {
          activeTab.value = taskType as ConfigTab
        }
        return { success: true, message: '任务偏好保存成功' }
      }
      return { success: false, message: response.msg || '保存失败' }
    } catch (error) {
      console.error('保存失败:', error)
      return { success: false, message: '网络错误' }
    } finally {
      isSaving.value = false
    }
  }

  return {
    multiModalConfig,
    providerKeys,
    generateCount,
    activeTab,
    isLoading,
    isSaving,
    fetchConfig,
    saveApiConfigAction,
    saveModelConfigAction,
    saveGenerateConfigAction,
    saveTaskTypeAction
  }
})
