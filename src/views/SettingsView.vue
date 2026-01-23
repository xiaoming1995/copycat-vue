<script setup lang="ts">
import { useSettingsStore, type LLMProvider } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { ref, onMounted, computed, Transition } from 'vue'

const settingsStore = useSettingsStore()
const { multiModalConfig, providerKeys, generateCount, isLoading } = storeToRefs(settingsStore)

// 1. 凭据管理逻辑
const activeProvider = ref<LLMProvider>('openai')
const showApiKey = ref(false)

const currentProviderKey = computed({
  get: () => providerKeys.value[activeProvider.value] || '',
  set: (val: string) => {
    providerKeys.value[activeProvider.value] = val
  }
})

// 2. 状态控制
const savingCredentials = ref(false)
const savingAllTasks = ref(false)
const savingGenerate = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const tabs = [
  { id: 'contentAnalysis', name: '文案分析', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { id: 'imageAnalysis', name: '图片分析', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
  { id: 'videoAnalysis', name: '视频分析', icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z' }
]

const providers: { label: string; value: LLMProvider; icon: string }[] = [
  { label: 'OpenAI', value: 'openai', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>' },
  { label: 'DeepSeek', value: 'deepseek', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' },
  { label: 'Kimi', value: 'moonshot', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>' },
  { label: 'Qwen', value: 'qwen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' },
  { label: 'Hunyuan', value: 'hunyuan', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
  { label: '豆包', value: 'doubao', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>' },
  { label: '智谱', value: 'zhipu', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>' },
  { label: 'Claude', value: 'anthropic', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>' }
]

const providerModels: Record<LLMProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  moonshot: ['kimi-latest', 'kimi-k2-turbo-preview', 'kimi-k2-thinking', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
  hunyuan: ['hunyuan-pro', 'hunyuan-standard', 'hunyuan-lite'],
  doubao: ['doubao-seed-1-8-251228', 'doubao-1.5-pro', 'doubao-1.5-lite', 'doubao-1.5-vision-pro', 'doubao-pro-32k', 'doubao-lite-32k'],
  zhipu: ['glm-4', 'glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4-long'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
}

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

const onTaskProviderChange = (tabId: string) => {
  const config = multiModalConfig.value[tabId as 'contentAnalysis' | 'imageAnalysis' | 'videoAnalysis']
  const models = providerModels[config.provider as LLMProvider]
  if (config && models && models.length > 0) {
    // 自动切到该模型列表的第一个
    config.model = models[0] as string
  }
}

const handleSaveCredentials = async () => {
  savingCredentials.value = true
  try {
    const res = await settingsStore.saveApiConfigAction()
    if (res.success) showMessage('success', '凭据保存成功')
    else showMessage('error', res.message)
  } finally {
    savingCredentials.value = false
  }
}

const handleSaveTaskConfig = async () => {
  savingAllTasks.value = true
  try {
    const res = await settingsStore.saveModelConfigAction()
    if (res.success) showMessage('success', '任务模型配置已保存')
    else showMessage('error', res.message)
  } finally {
    savingAllTasks.value = false
  }
}



const handleSaveGenerate = async () => {
  savingGenerate.value = true
  try {
    const res = await settingsStore.saveGenerateConfigAction()
    if (res.success) showMessage('success', '生成参数已更新')
  } finally {
    savingGenerate.value = false
  }
}

onMounted(async () => {
  await settingsStore.fetchConfig()
})
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-10">
      
      <!-- 消息提示 -->
      <div class="fixed top-24 right-8 z-50 flex flex-col gap-3 pointer-events-none">
        <Transition name="slide">
          <div v-if="showSuccess" class="bg-white border-l-4 border-emerald-500 p-4 rounded-xl shadow-2xl flex items-center pointer-events-auto ring-1 ring-black/5">
            <div class="bg-emerald-100 p-2 rounded-full mr-3 text-emerald-600">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span class="font-semibold text-slate-800">{{ successMsg }}</span>
          </div>
        </Transition>
        <Transition name="slide">
          <div v-if="showError" class="bg-white border-l-4 border-rose-500 p-4 rounded-xl shadow-2xl flex items-center pointer-events-auto ring-1 ring-black/5">
            <div class="bg-rose-100 p-2 rounded-full mr-3 text-rose-600">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span class="font-semibold text-slate-800">{{ errorMsg }}</span>
          </div>
        </Transition>
      </div>

      <!-- 标题栏 -->
      <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 overflow-hidden relative group">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
        <div class="relative">
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">智能配置中心</h1>
          <p class="mt-2 text-slate-500 text-lg">统一管理您的 AI 算力凭据与任务调度</p>
        </div>
      </div>

      <!-- 核心板块：1. 凭据中心 -->
      <section class="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
             </div>
             <h2 class="text-xl font-bold text-slate-900">API 凭据资产管理</h2>
          </div>
          <button @click="handleSaveCredentials" :disabled="savingCredentials" class="btn-primary group">
            <svg v-if="savingCredentials" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ savingCredentials ? '正在同步资产...' : '保存凭据' }}
          </button>
        </div>

        <div class="p-8">
          <div class="flex flex-wrap gap-4 mb-10">
            <button 
              v-for="p in providers" 
              :key="p.value"
              @click="activeProvider = p.value"
              class="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-300 relative group"
              :class="activeProvider === p.value ? 'border-indigo-600 bg-indigo-50/30 shadow-md' : 'border-slate-100 hover:border-slate-300'"
            >
              <div class="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" :class="{ 'text-indigo-600': activeProvider === p.value }" v-html="p.icon"></div>
              <span class="font-bold text-slate-800">{{ p.label }}</span>
              <div v-if="activeProvider === p.value" class="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-end animate-fade-in" :key="activeProvider">
            <div class="md:col-span-12">
               <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">正在配置 {{ providers.find(p => p.value === activeProvider)?.label }} 凭据</p>
            </div>
            <div class="md:col-span-7">
               <label class="block text-sm font-bold text-slate-700 mb-2 ml-1">API Key</label>
               <div class="relative">
                  <input 
                    :type="showApiKey ? 'text' : 'password'"
                    v-model="currentProviderKey"
                    class="input-premium pl-14"
                    :placeholder="`请输入您的 ${activeProvider} 密钥`"
                  />
                  <div class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <button @click="showApiKey = !showApiKey" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path v-if="showApiKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                       <g v-else>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </g>
                     </svg>
                  </button>
               </div>
            </div>
            <div class="md:col-span-5">
               <label class="block text-sm font-bold text-slate-700 mb-2 ml-1">代理端点 (Base URL)</label>
               <input 
                 v-model="multiModalConfig.contentAnalysis.baseUrl"
                 readonly
                 class="input-premium bg-slate-50 text-slate-400 cursor-not-allowed border-dashed"
                 placeholder="后端代理固定地址"
               />
            </div>
          </div>
        </div>
      </section>

      <!-- 核心板块：2. 任务模型配置 -->
      <section class="space-y-6">
        <div class="flex items-center justify-between px-2">
           <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900">精细化模型调度</h2>
           </div>
           <button @click="handleSaveTaskConfig" :disabled="savingAllTasks" class="btn-primary-indigo shadow-indigo-100 shadow-xl">
              确认所有调度变更
           </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="t in tabs" 
            :key="t.id"
            class="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 group"
          >
             <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                   <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="t.icon" /></svg>
                </div>
                <h3 class="font-bold text-slate-800 text-lg">{{ t.name }}</h3>
             </div>

             <div class="space-y-6">
                <div>
                   <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">执行服务商</label>
                   <select 
                    v-model="multiModalConfig[t.id as 'contentAnalysis' | 'imageAnalysis' | 'videoAnalysis'].provider"
                    @change="onTaskProviderChange(t.id)"
                    class="input-select"
                   >
                     <option v-for="p in providers" :key="p.value" :value="p.value">{{ p.label }}</option>
                   </select>
                </div>
                <div>
                   <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">指定的 AI 模型</label>
                   <select 
                    v-model="multiModalConfig[t.id as 'contentAnalysis' | 'imageAnalysis' | 'videoAnalysis'].model"
                    class="input-select"
                   >
                     <option 
                      v-for="m in providerModels[multiModalConfig[t.id as 'contentAnalysis' | 'imageAnalysis' | 'videoAnalysis'].provider as LLMProvider]" 
                      :key="m" 
                      :value="m"
                     >
                       {{ m }}
                     </option>
                   </select>
                </div>
             </div>
          </div>
        </div>
      </section>

      <!-- 核心板块：3. 其他策略 -->
      <section class="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div class="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="flex-1">
             <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h4 class="font-bold text-slate-800">副本生成策略</h4>
             </div>
             <p class="text-sm text-slate-500">调整每次文案仿写生成的数量建议 (1-10)</p>
          </div>
          <div class="flex items-center gap-6 w-full md:w-auto">
             <div class="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 min-w-[200px]">
                <input 
                  type="range" 
                  min="1" max="10" 
                  v-model.number="generateCount"
                  class="flex-1 accent-purple-600"
                />
                <span class="font-black text-purple-600 w-8 text-center">{{ generateCount }}</span>
             </div>
             <button @click="handleSaveGenerate" :disabled="savingGenerate" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-purple-100 transition-all flex items-center">
                {{ savingGenerate ? '提交中...' : '应用策略' }}
             </button>
          </div>
        </div>
      </section>

      <!-- 底部门槛灯 -->
      <div v-if="isLoading" class="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 flex items-center justify-center">
         <div class="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 ring-1 ring-black/5 animate-scale-in">
            <div class="relative w-16 h-16">
               <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p class="font-bold text-slate-800 text-lg">正在同步云端配置...</p>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.input-premium {
  @apply w-full h-14 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 font-medium pr-4 
         focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-50 
         transition-all duration-300 placeholder:text-slate-300;
}

.input-select {
  @apply w-full h-14 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold px-4 
         hover:bg-slate-100 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all cursor-pointer;
}

.btn-primary {
  @apply bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-2xl shadow-xl 
         transition-all duration-300 flex items-center disabled:bg-slate-300;
}

.btn-primary-indigo {
  @apply bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-[1.25rem] 
         transition-all duration-300 flex items-center disabled:opacity-50;
}

.slide-enter-active, .slide-leave-active { transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
.slide-enter-from { opacity: 0; transform: translateY(-20px) scale(0.95); }
.slide-leave-to { opacity: 0; transform: translateX(20px); }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
@keyframes scaleIn { from { scale: 0.8; opacity: 0; } to { scale: 1; opacity: 1; } }
</style>