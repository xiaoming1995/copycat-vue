<script setup lang="ts">
import { useSettingsStore, type LLMProvider } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { ref, onMounted, watch, computed } from 'vue'

const settingsStore = useSettingsStore()
const { multiModalConfig, activeTab, isLoading, isSaving } = storeToRefs(settingsStore)

// Helper to get current config
const currentConfig = computed(() => multiModalConfig.value[activeTab.value])

const providers: { label: string; value: LLMProvider; icon: string }[] = [
  { 
    label: 'OpenAI', 
    value: 'openai',
    icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.0462 6.0462 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729ZM13.2549 22.8476a4.7651 4.7651 0 0 1-3.2796-.6964 2.808 2.808 0 0 0-.1043.0095l-1.0838.419-.0615.3526v.0143c-.0048.1189-.0095.2427-.0095.3664a4.8466 4.8466 0 0 1-3.86-4.7114v-.8994l2.5833-1.499-.5471-1.4325L4.2546 15.828a4.8656 4.8656 0 0 1-1.0933-2.0795 4.7889 4.7889 0 0 1-.3663-1.8416c0-.138.0048-.2712.0095-.3997.0048-.1523.0143-.3046.0238-.4568l.0095-.0857.2474-1.1218.8469-.3284 2.2217 1.2895.5329-1.4516-2.1122-1.2229a4.8608 4.8608 0 0 1 1.694-2.284 4.7842 4.7842 0 0 1 2.4174-.6535 4.8608 4.8608 0 0 1 3.5508 1.5466l.5709.8423 2.117-1.2229a4.7794 4.7794 0 0 1 4.3973-.0285 4.8656 4.8656 0 0 1 2.274 3.036l.2093 1.0933-2.293 1.3323.5376 1.4468 2.155-1.2514a4.8703 4.8703 0 0 1 .495 2.5837 4.7556 4.7556 0 0 1-1.06 2.6598l-1.0933.6424-.5567 1.485 2.1598 1.2515c-.4806 1.4135-1.5798 2.5456-3.0312 3.1264l-1.1552.4473-2.2217-1.2896-.5472 1.4372 2.1123 1.2277Zm-8.474-11.7243a3.597 3.597 0 0 0 .0476-.7178c0-.1428-.0048-.2807-.0095-.4188a3.7017 3.7017 0 0 0-1.0611 1.9606l2.1265 1.2323a3.6065 3.6065 0 0 0 1.2942-.8185l-2.3977-1.2378Zm13.2549 1.637a3.5875 3.5875 0 0 0 .0476.7138c0 .1428-.0048.2855-.0095.4188a3.7255 3.7255 0 0 0 1.0658-1.9558l-2.1313-1.2323a3.616 3.616 0 0 0-1.2942.8233l2.3216 1.2322Zm-1.8986-5.4633a3.7208 3.7208 0 0 0-2.0795-1.0564l-1.2229 2.1224a3.616 3.616 0 0 0 .8232 1.2895l2.4792-2.3555Zm-8.2313 10.9725a3.6827 3.6827 0 0 0 2.0795 1.0612l1.2229-2.1171a3.597 3.597 0 0 0-.8232-1.2942l-2.4792 2.3501Zm2.6648-7.7983-1.2229-2.117a3.7255 3.7255 0 0 0-2.0033 1.4276l2.4025 1.4085a3.6256 3.6256 0 0 0 .8237-.719ZM13.8497 20.31l1.2276 2.1123a3.7255 3.7255 0 0 0 2.0033-1.4276l-2.4025-1.4085a3.616 3.616 0 0 0-.8284.7238Zm-5.3344-3.5222 1.77-3.0741 3.079 1.77-3.079 1.789-1.77-.4849Z"/></svg>'
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

// Watch provider change to reset model or set default
watch(() => currentConfig.value.provider, (newProvider) => {
  if (newProvider) {
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

// 页面加载时获取配置
onMounted(async () => {
  await settingsStore.fetchConfig()
})

// 保存配置
const handleSave = async () => {
  showSuccess.value = false
  showError.value = false
  
  const result = await settingsStore.saveConfig()
  
  if (result.success) {
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } else {
    errorMsg.value = result.message
    showError.value = true
    setTimeout(() => {
      showError.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 py-10">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      
      <!-- Header -->
      <div class="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 mb-8">
        <div class="absolute inset-0 h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
        <div class="absolute inset-0 h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div class="relative p-8 sm:p-10">
          <h1 class="text-3xl font-bold tracking-tight text-white">配置中心</h1>
          <p class="mt-2 text-lg text-indigo-100">设置大模型参数，定制你的专属 AI 助手</p>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5 overflow-hidden">
        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex" aria-label="Tabs">
            <button
              v-for="tab in [
                { id: 'contentAnalysis', name: '文案分析与生成' },
                { id: 'imageAnalysis', name: '图片分析与生成' },
                { id: 'videoAnalysis', name: '视频分析与生成' }
              ]"
              :key="tab.id"
              @click="activeTab = tab.id as any"
              :class="[
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'w-1/3 border-b-2 py-4 px-1 text-center text-sm font-medium transition-colors duration-200'
              ]"
            >
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <div class="p-8 sm:p-10 space-y-10">
          <!-- Provider Selection -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.072 0 2.063.49 2.7 1.35l3.112 5.1a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold leading-7 text-gray-900">模型服务商</h2>
                <p class="text-sm text-gray-500">为<span class="font-bold text-indigo-600 mx-1">{{ activeTab === 'contentAnalysis' ? '文案分析与生成' : (activeTab === 'imageAnalysis' ? '图片分析与生成' : '视频分析与生成') }}</span>功能选择 AI 模型</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div 
                v-for="provider in providers" 
                :key="provider.value"
                class="relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all duration-200"
                :class="[
                  currentConfig.provider === provider.value 
                    ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50/50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                ]"
                @click="currentConfig.provider = provider.value"
              >
                <div class="flex w-full items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="text-gray-900" :class="{ 'text-indigo-600': currentConfig.provider === provider.value }" v-html="provider.icon"></div>
                    <span class="block text-sm font-medium text-gray-900">{{ provider.label }}</span>
                  </div>
                  <div 
                    class="h-4 w-4 rounded-full border flex items-center justify-center"
                    :class="[
                      currentConfig.provider === provider.value 
                        ? 'border-indigo-600 bg-indigo-600' 
                        : 'border-gray-300'
                    ]"
                  >
                    <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- API Configuration -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold leading-7 text-gray-900">API 参数配置</h2>
                <p class="text-sm text-gray-500">配置 API Key 和其他连接参数</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label for="apiKey" class="block text-sm font-medium leading-6 text-gray-900">API Key</label>
                <div class="mt-2 relative">
                  <input
                    type="password"
                    id="apiKey"
                    v-model="currentConfig.apiKey"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                    placeholder="sk-..."
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </div>
                </div>
                <p class="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  您的 API Key 仅存储在本地浏览器中，不会发送到我们的服务器。
                </p>
              </div>

              <div class="sm:col-span-4">
                <label for="model" class="block text-sm font-medium leading-6 text-gray-900">模型名称 (Model)</label>
                <div class="mt-2">
                  <select
                    id="model"
                    v-model="currentConfig.model"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                  >
                    <option v-for="model in providerModels[currentConfig.provider] || []" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="sm:col-span-4">
                <label for="baseUrl" class="block text-sm font-medium leading-6 text-gray-900">API Base URL</label>
                <div class="mt-2">
                  <input
                    type="text"
                    id="baseUrl"
                    v-model="currentConfig.baseUrl"
                    readonly
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-500 bg-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow cursor-not-allowed"
                  />
                </div>
                <p class="mt-2 text-xs text-gray-500">已根据选择的服务商自动配置</p>
              </div>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Generation Settings -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold leading-7 text-gray-900">生成设置</h2>
                <p class="text-sm text-gray-500">配置内容生成的行为和参数</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label for="batchSize" class="block text-sm font-medium leading-6 text-gray-900">单次仿写条数</label>
                <div class="mt-2">
                  <input
                    type="number"
                    id="batchSize"
                    v-model.number="currentConfig.batchSize"
                    min="1"
                    max="10"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"
                  />
                </div>
                <p class="mt-2 text-xs text-gray-500">设置一次生成多少条仿写结果（建议 1-5 条）</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-8 py-6 flex items-center justify-between border-t border-gray-100">
           <div class="flex items-center">
             <!-- 成功提示 -->
             <div v-if="showSuccess" class="text-sm font-medium text-green-600 flex items-center animate-fade-in">
                <div class="rounded-full bg-green-100 p-1 mr-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                配置已保存到服务器
            </div>
            <!-- 错误提示 -->
            <div v-if="showError" class="text-sm font-medium text-red-600 flex items-center animate-fade-in">
                <div class="rounded-full bg-red-100 p-1 mr-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                {{ errorMsg }}
            </div>
            <!-- 加载中提示 -->
            <div v-if="isLoading" class="text-sm text-gray-500 flex items-center">
              <svg class="animate-spin h-4 w-4 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在加载配置...
            </div>
           </div>
          <button
            type="button"
            @click="handleSave"
            :disabled="isSaving || isLoading"
            class="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSaving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
