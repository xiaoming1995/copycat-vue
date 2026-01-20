<script setup lang="ts">
import { ref } from 'vue'
import type { AnalysisData } from '../stores/history'

defineProps<{
  result: AnalysisData
  isGenerating?: boolean
  generatedContent?: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'generate', topic: string, forceRegenerate?: boolean): void
}>()

const newTopic = ref('')

const handleGenerate = () => {
  if (!newTopic.value.trim()) return
  emit('generate', newTopic.value.trim(), false)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('提示词已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('提示词已复制到剪贴板！')
  }
}
</script>

<template>
  <div class="w-full max-w-5xl animate-fade-in space-y-8">
    <!-- Header with Back Button -->
    <div class="flex items-center space-x-4">
      <button 
        @click="emit('back')"
        class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <h2 class="text-2xl font-bold text-gray-900">
        {{ result.contentType === 'video' ? '视频拆解报告' : (result.contentType === 'images' ? '图文拆解报告' : '深度拆解报告') }}
      </h2>
    </div>

    <!-- Analysis Cards Grid -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <!-- 0. Title Analysis (新增) -->
      <div v-if="result.titleAnalysis" class="md:col-span-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-md ring-1 ring-amber-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">📝</span> 标题分析
          <span class="ml-auto flex items-center text-orange-600">
            <span class="text-2xl font-bold">{{ result.titleAnalysis.score }}</span>
            <span class="text-sm ml-1">/10 分</span>
          </span>
        </h3>
        <div class="space-y-4">
          <div>
            <span class="text-xs font-semibold text-gray-500 uppercase">原始标题</span>
            <p class="mt-1 text-lg font-medium text-gray-900">{{ result.titleAnalysis.original || '未识别' }}</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-xs font-semibold text-amber-600 uppercase">吸睛点</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span 
                  v-for="hook in result.titleAnalysis.hooks" 
                  :key="hook"
                  class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                >
                  {{ hook }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-xs font-semibold text-orange-600 uppercase">使用技巧</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span 
                  v-for="tech in result.titleAnalysis.techniques" 
                  :key="tech"
                  class="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
                >
                  {{ tech }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1. Emotion Tags (Common) -->
      <div class="md:col-span-1 rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🎭</span> 情绪基调
        </h3>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="emotion in result.emotions" 
            :key="emotion"
            class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
          >
            {{ emotion }}
          </span>
        </div>
      </div>

      <!-- 2. Content Specific Analysis -->
      <!-- Video Analysis -->
      <div v-if="result.contentType === 'video' && result.video" class="md:col-span-2 space-y-6">
        <div class="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5">
            <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <span class="mr-2 text-2xl">🎥</span> 视频分析
            </h3>
            <div class="space-y-4">
            <div>
                <h4 class="text-sm font-medium text-gray-500">拍摄手法</h4>
                <p class="mt-1 text-gray-900">{{ result.video.shootingTechnique }}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">爆点分析</h4>
                <p class="mt-1 text-gray-900">{{ result.video.highlight }}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">提取文案</h4>
                <p class="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">{{ result.video.script }}</p>
            </div>
            </div>
        </div>
      </div>

      <!-- Images Analysis -->
      <div v-if="result.contentType === 'images' && result.images" class="md:col-span-3">
        <div class="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5">
             <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <span class="mr-2 text-2xl">🖼️</span> 图片逐帧分析
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="(img, idx) in result.images" :key="idx" class="border rounded-lg overflow-hidden">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-200 relative group">
                        <!-- Placeholder for image -->
                        <img v-if="img.url" :src="img.url" class="w-full h-48 object-cover" :alt="`图${idx+1}`" />
                        <div v-else class="flex items-center justify-center h-48 bg-gray-100 text-gray-400">
                            <span class="text-xs">无图片</span>
                        </div>
                    </div>
                    <div class="p-4 space-y-2">
                        <div>
                            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wide">拍摄手法</span>
                            <p class="text-sm text-gray-900">{{ img.shootingTechnique }}</p>
                        </div>
                         <div>
                            <span class="text-xs font-semibold text-pink-600 uppercase tracking-wide">视觉爆点</span>
                            <p class="text-sm text-gray-900">{{ img.highlight }}</p>
                        </div>
                        <div v-if="img.composition">
                            <span class="text-xs font-semibold text-teal-600 uppercase tracking-wide">构图</span>
                            <p class="text-sm text-gray-900">{{ img.composition }}</p>
                        </div>
                        <div v-if="img.colorTone" class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-amber-600 uppercase tracking-wide">色调</span>
                            <p class="text-sm text-gray-900">{{ img.colorTone }}</p>
                        </div>
                        <div v-if="img.mood">
                            <span class="text-xs font-semibold text-purple-600 uppercase tracking-wide">情绪</span>
                            <p class="text-sm text-gray-900">{{ img.mood }}</p>
                        </div>
                        <div v-if="img.imagePrompt" class="mt-2 pt-2 border-t border-gray-100">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wide">🎨 图片生成提示词</span>
                                <button 
                                    @click.stop="copyToClipboard(img.imagePrompt)"
                                    class="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
                                    title="复制提示词"
                                >
                                    📋 复制
                                </button>
                            </div>
                            <p class="text-xs text-gray-600 bg-gray-50 p-2 rounded break-words italic">{{ img.imagePrompt }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- 3. Structure Analysis (Common, adapts position based on type) -->
      <div :class="[
          'rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5',
          result.contentType === 'text' ? 'md:col-span-2' : 'md:col-span-3'
        ]">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🧬</span> 爆款逻辑拆解
        </h3>
        <div class="relative pl-4">
          <!-- Timeline line -->
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>
          
          <div class="space-y-6">
            <div v-for="(step, index) in result.structure" :key="index" class="relative pl-8">
              <!-- Dot -->
              <div class="absolute left-2.5 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-indigo-600 ring-4 ring-white"></div>
              
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-indigo-600">STEP {{ index + 1 }}</span>
                <span class="font-medium text-gray-900">{{ step.title }}</span>
                <p class="mt-1 text-sm text-gray-500">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generation Result (if available) -->
    <div v-if="generatedContent" class="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-1 shadow-lg animate-fade-in">
      <div class="rounded-lg bg-white p-6 sm:p-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900 flex items-center">
            <span class="mr-2 text-2xl">✨</span> 仿写生成结果
          </h3>
          <button 
            @click="$emit('generate', newTopic || '同主题', true)" 
            :disabled="isGenerating"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isGenerating" class="animate-spin -ml-1 mr-1 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {{ isGenerating ? '生成中...' : '重新生成' }}
          </button>
        </div>
        <div class="prose prose-indigo max-w-none bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
            <div v-if="isGenerating" class="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                 <div class="flex flex-col items-center">
                    <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span class="text-sm font-medium text-indigo-600 animate-pulse">AI 正在撰写新文案...</span>
                 </div>
            </div>
          <p class="whitespace-pre-wrap text-gray-800 leading-relaxed">{{ generatedContent }}</p>
        </div>
        <div class="mt-4 flex justify-end">
          <button 
            onclick="navigator.clipboard.writeText(this.getAttribute('data-content')).then(() => alert('已复制到剪贴板'))"
            :data-content="generatedContent"
            class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            一键复制
          </button>
        </div>
      </div>
    </div>

    <!-- Generation Input Area -->
    <div v-else class="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-md ring-1 ring-indigo-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">✨ 想要仿写什么主题？</h3>
      <p class="text-sm text-gray-500 mb-4">基于上述逻辑，为你生成全新的爆款文案</p>
      
      <div class="flex gap-4">
        <input 
          v-model="newTopic"
          type="text" 
          placeholder="例如：把这款『熬夜面霜』的逻辑，套用到『护眼仪』上..." 
          class="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
          @keyup.enter="handleGenerate"
        />
        <button 
          @click="handleGenerate"
          :disabled="isGenerating"
          class="whitespace-nowrap rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <svg v-if="isGenerating" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isGenerating ? '生成中...' : '立即生成' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
