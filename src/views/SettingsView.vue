<script setup lang="ts">
import { useSettingsStore, type LLMProvider } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { ref, onMounted, watch, computed } from 'vue'

const settingsStore = useSettingsStore()
const { multiModalConfig, providerKeys, generateCount, activeTab, isLoading } = storeToRefs(settingsStore)

// Helper to get current config
const currentConfig = computed(() => multiModalConfig.value[activeTab.value])

// Helper to get active tab name
const activeTabName = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.name : '模型'
})

// Local loading states for independent button feedback
const savingTaskType = ref(false)
const savingModel = ref(false)
const savingGenerate = ref(false)

const tabs = [
  { id: 'contentAnalysis', name: '文案分析与生成', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { id: 'imageAnalysis', name: '图片分析与生成', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
  { id: 'videoAnalysis', name: '视频分析与生成', icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z' }
]

const providers: { label: string; value: LLMProvider; icon: string }[] = [
  { 
    label: 'OpenAI', 
    value: 'openai',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.5-2.9A6.06 6.06 0 0 0 5 4.18a6 6 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 6 6 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A6.05 6.05 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 6 6 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08ZM13.25 22.85a4.76 4.76 0 0 1-3.28-.7 2.8 2.8 0 0 0-1.19.43l-1.08.42a4.85 4.85 0 0 1-3.86-4.71v-.9l2.58-1.5-.55-1.43-2.61.9a4.87 4.87 0 0 1-1.1-2.08 4.79 4.79 0 0 1-.36-1.84c0-.14 0-.27.01-.4a2.8 2.8 0 0 0 0-.54l.25-1.12.85-.33 2.22 1.29.53-1.45-2.11-1.22a4.86 4.86 0 0 1 1.69-2.28 4.78 4.78 0 0 1 2.42-.66 4.86 4.86 0 0 1 3.55 1.55l.57.84 2.12-1.22a4.78 4.78 0 0 1 4.4 0 4.86 4.86 0 0 1 2.27 3.03l.21 1.1-2.29 1.33.54 1.45 2.15-1.25a4.87 4.87 0 0 1 .5 2.58 4.76 4.76 0 0 1-1.06 2.66l-1.1.64-.55 1.49 2.16 1.25c-.48 1.41-1.58 2.54-3.03 3.12l-1.16.45-2.22-1.29-.55 1.44 2.11 1.23Zm-8.47-11.72a3.6 3.6 0 0 0 0-1.14 3.7 3.7 0 0 0-1.06 1.96l2.13 1.23a3.6 3.6 0 0 0 1.29-.82l-2.4-1.23Zm13.25 1.63a3.59 3.59 0 0 0 0-1.13 3.73 3.73 0 0 0 1.07-1.96l-2.13-1.23a3.62 3.62 0 0 0-1.3.82l2.32 1.23Zm-1.9-5.46a3.72 3.72 0 0 0-2.08-1.06l-1.22 2.12a3.62 3.62 0 0 0 .82 1.29l2.48-2.35Zm-8.23 10.97a3.68 3.68 0 0 0 2.08 1.06l1.22-2.12a3.6 3.6 0 0 0-.82-1.29l-2.48 2.35Zm2.66-7.8-1.22-2.11a3.73 3.73 0 0 0-2 1.42l2.4 1.41a3.63 3.63 0 0 0 .82-.72Z"/></svg>'
  },
  { 
    label: 'DeepSeek', 
    value: 'deepseek',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>'
  },
  {
    label: 'Kimi (Moonshot)',
    value: 'moonshot',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>'
  },
  {
    label: '通义千问 (Qwen)',
    value: 'qwen',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>'
  },
  {
    label: '腾讯混元',
    value: 'hunyuan',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
  },
  {
    label: '豆包 (Doubao)',
    value: 'doubao',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>'
  },
  {
    label: '智谱 AI (GLM)',
    value: 'zhipu',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>'
  },
  { 
    label: 'Anthropic', 
    value: 'anthropic',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>'
  }
]

const providerModels: Record<LLMProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  moonshot: ['kimi-latest', 'kimi-k2-turbo-preview', 'kimi-k2-thinking', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
  hunyuan: ['hunyuan-pro', 'hunyuan-standard', 'hunyuan-lite'],
  doubao: ['doubao-pro-32k', 'doubao-pro-4k', 'doubao-lite-32k', 'doubao-lite-4k'],
  zhipu: ['glm-4', 'glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4-long'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
}

const providerBaseUrls: Record<LLMProvider, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com',
  moonshot: 'https://api.moonshot.cn/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  hunyuan: 'https://api.hunyuan.cloud.tencent.com/v1',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  anthropic: 'https://api.anthropic.com/v1'
}

// Watch provider change to reset model or set default, and load API Key
watch(() => currentConfig.value.provider, (newProvider, oldProvider) => {
  if (newProvider) {
    // 保存旧提供商的 API Key（如果有变化且不是脱敏的 key）
    if (oldProvider && currentConfig.value.apiKey && !currentConfig.value.apiKey.includes('****')) {
      providerKeys.value[oldProvider] = currentConfig.value.apiKey
    }
    
    // 加载新提供商的 API Key
    currentConfig.value.apiKey = providerKeys.value[newProvider] || ''
    
    // Set default Base URL
    if (providerBaseUrls[newProvider]) {
      currentConfig.value.baseUrl = providerBaseUrls[newProvider]
    }
    
    // Set default Model
    if (providerModels[newProvider]) {
      // If current model is not in the new provider's list, set to first one
      if (!providerModels[newProvider].includes(currentConfig.value.model)) {
        currentConfig.value.model = providerModels[newProvider][0] || ''
      }
    }
  }
})

const showSuccess = ref(false)
const showError = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const showMessage = (type: 'success' | 'error', msg: string) => {
  if (type === 'success') {
    successMsg.value = msg
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } else {
    errorMsg.value = msg
    showError.value = true
    setTimeout(() => { showError.value = false }, 5000)
  }
}

// 页面加载时获取配置
onMounted(async () => {
  await settingsStore.fetchConfig()
  
  // 恢复保存的 Tab
  const savedTab = localStorage.getItem('copycat_settings_active_tab')
  if (savedTab && tabs.find(t => t.id === savedTab)) {
    activeTab.value = savedTab as any
  }
})

// 1. 保存任务类型选择 (仅保存本地偏好)
const handleSaveTaskType = async () => {
  savingTaskType.value = true
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 500))
  localStorage.setItem('copycat_settings_active_tab', activeTab.value)
  showMessage('success', '任务类型偏好保存成功')
  savingTaskType.value = false
}

// 2. 保存模型设置 (合并了服务商、Key、URL、Model)
const handleSaveModelSettings = async () => {
  showSuccess.value = false
  showError.value = false
  savingModel.value = true
  
  // 同步当前 API Key 到 providerKeys
  if (currentConfig.value.apiKey && !currentConfig.value.apiKey.includes('****')) {
    providerKeys.value[currentConfig.value.provider] = currentConfig.value.apiKey
  }
  
  try {
    // 并行执行两个保存操作
    const results = await Promise.all([
      settingsStore.saveApiConfigAction(),
      settingsStore.saveModelConfigAction()
    ])
    
    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      showMessage('error', failures.map(f => f.message).join('; '))
    } else {
      showMessage('success', '模型配置保存成功')
    }
  } catch (error) {
    showMessage('error', '保存过程中发生错误')
  } finally {
    savingModel.value = false
  }
}

// 3. 保存生成设置
const handleSaveGenerate = async () => {
  showSuccess.value = false
  showError.value = false
  savingGenerate.value = true
  
  try {
    const result = await settingsStore.saveGenerateConfigAction()
    if (result.success) {
      showMessage('success', '生成设置保存成功')
    } else {
      showMessage('error', result.message || '保存失败')
    }
  } catch (error) {
    showMessage('error', '保存过程中发生错误')
  } finally {
    savingGenerate.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 py-10">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      
      <!-- Global Status Message (Fixed at top right) -->
      <div class="fixed top-24 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        <div v-if="showSuccess" class="bg-white border border-green-100 text-green-800 px-4 py-3 rounded-xl shadow-xl flex items-center animate-slide-in pointer-events-auto ring-1 ring-green-900/5">
           <div class="flex-shrink-0 bg-green-50 rounded-full p-1 mr-3">
             <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
             </svg>
           </div>
           <span class="font-medium">{{ successMsg }}</span>
        </div>
        <div v-if="showError" class="bg-white border border-red-100 text-red-800 px-4 py-3 rounded-xl shadow-xl flex items-center animate-slide-in pointer-events-auto ring-1 ring-red-900/5">
           <div class="flex-shrink-0 bg-red-50 rounded-full p-1 mr-3">
             <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <span class="font-medium">{{ errorMsg }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        
        <!-- Header -->
        <div class="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div class="absolute inset-0 h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
          <div class="absolute inset-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <div class="relative p-8 sm:p-10">
            <h1 class="text-3xl font-bold tracking-tight text-white">配置中心</h1>
            <p class="mt-2 text-lg text-indigo-100">自定义您的 AI 助手参数与行为</p>
          </div>
        </div>

        <!-- Module 1: Task Type Selection -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
           <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                <h3 class="text-base font-semibold leading-6 text-gray-900">任务类型选择</h3>
              </div>
              <button
                type="button"
                @click="handleSaveTaskType"
                :disabled="savingTaskType"
                class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="savingTaskType" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ savingTaskType ? '保存中...' : '保存' }}
              </button>
           </div>
           <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id as any"
                  class="relative group flex items-center p-4 rounded-xl border-2 transition-all duration-200"
                  :class="[
                    activeTab === tab.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  ]"
                >
                  <div class="mr-4 flex-shrink-0 p-2 rounded-lg transition-colors" :class="activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
                    </svg>
                  </div>
                  <div class="text-left">
                     <p class="text-sm font-semibold" :class="activeTab === tab.id ? 'text-indigo-900' : 'text-gray-900'">{{ tab.name }}</p>
                     <p class="text-xs text-gray-500 mt-0.5">点击切换配置</p>
                  </div>
                  <div v-if="activeTab === tab.id" class="absolute top-3 right-3 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></div>
                </button>
              </div>
           </div>
        </div>

        <!-- Module 2: Model Settings (Provider, Key, URL, Model) -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-indigo-500"></div>
              <h3 class="text-base font-semibold leading-6 text-gray-900">{{ activeTabName }}模型配置</h3>
            </div>
            <button
              type="button"
              @click="handleSaveModelSettings"
              :disabled="savingModel"
              class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <svg v-if="savingModel" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               {{ savingModel ? '保存中...' : '保存配置' }}
            </button>
          </div>
          
          <div class="p-6">
            <!-- Section 1: Provider Selection -->
            <div class="mb-8">
              <label class="block text-sm font-medium leading-6 text-gray-900 mb-3">选择服务商</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                  v-for="provider in providers" 
                  :key="provider.value"
                  class="relative group cursor-pointer"
                  @click="currentConfig.provider = provider.value"
                >
                  <div 
                    class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 h-24"
                    :class="[
                      currentConfig.provider === provider.value 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                     <div class="text-gray-900 mb-2 transition-transform duration-200 group-hover:scale-110" :class="{ 'text-indigo-600': currentConfig.provider === provider.value }" v-html="provider.icon"></div>
                     <span class="text-xs font-medium text-center truncate w-full px-1" :class="currentConfig.provider === provider.value ? 'text-indigo-900' : 'text-gray-600'">{{ provider.label }}</span>
                  </div>
                  <div v-if="currentConfig.provider === provider.value" class="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></div>
                </div>
              </div>
            </div>
            
            <hr class="border-gray-100 mb-8" />

            <!-- Section 2: Details & Model -->
            <div class="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
              <!-- API Key -->
              <div class="sm:col-span-1">
                <label for="apiKey" class="block text-sm font-medium leading-6 text-gray-900">API Key</label>
                <div class="mt-2 relative">
                  <input
                    type="password"
                    id="apiKey"
                    v-model="currentConfig.apiKey"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
                    placeholder="sk-..."
                  />
                </div>
              </div>

              <!-- Base URL -->
              <div class="sm:col-span-1">
                <label for="baseUrl" class="block text-sm font-medium leading-6 text-gray-900">API Base URL</label>
                <div class="mt-2 relative">
                   <input
                    type="text"
                    id="baseUrl"
                    v-model="currentConfig.baseUrl"
                    readonly
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-not-allowed"
                  />
                </div>
              </div>

              <!-- Model Select -->
              <div class="sm:col-span-1">
                <label for="model" class="block text-sm font-medium leading-6 text-gray-900">模型选择</label>
                <div class="mt-2 relative">
                  <select
                    id="model"
                    v-model="currentConfig.model"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white shadow-sm appearance-none"
                  >
                    <option v-for="model in providerModels[currentConfig.provider] || []" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Module 3: Generation Settings -->
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-purple-500"></div>
              <h3 class="text-base font-semibold leading-6 text-gray-900">生成参数</h3>
            </div>
            <button
              type="button"
              @click="handleSaveGenerate"
              :disabled="savingGenerate"
              class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <svg v-if="savingGenerate" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               {{ savingGenerate ? '保存中...' : '保存' }}
            </button>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
               <label for="batchSize" class="block text-sm font-medium leading-6 text-gray-900">单次生成数量</label>
               <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{{ generateCount }} 条</span>
            </div>
            
            <div class="mt-2">
              <input
                type="range"
                id="batchSizeRange"
                v-model.number="generateCount"
                min="1"
                max="10"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
             <p class="mt-3 text-xs text-gray-500">
              增加生成数量可能会延长处理时间。建议设置为 1-3 条。
            </p>
          </div>
        </div>

      </div>
      
      <!-- Bottom Loading Indicator -->
      <div v-if="isLoading" class="mt-8 flex justify-center">
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 text-sm text-gray-500">
          <svg class="animate-spin h-4 w-4 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          正在加载配置...
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>