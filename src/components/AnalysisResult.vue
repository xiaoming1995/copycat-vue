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

      <!-- 视频专属分析卡片 -->
      <!-- 1. 开头钩子 (支持新旧两版: hook / hook_strategy) -->
      <div v-if="result.contentType === 'video' && (result.hook || result.hook_strategy)" class="md:col-span-1 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-6 shadow-md ring-1 ring-rose-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🎣</span> 开头钩子
          <span class="ml-auto text-rose-600 text-lg font-bold">{{ result.hook?.effectiveness || result.hook_strategy?.effectiveness_score || 0 }}/10</span>
        </h3>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded">{{ result.hook?.type || result.hook_strategy?.type }}</span>
            <span class="text-xs text-gray-500">{{ result.hook?.duration || result.hook_strategy?.estimated_duration }}</span>
          </div>
          <p class="text-sm text-gray-700">{{ result.hook?.description || result.hook_strategy?.description }}</p>
        </div>
      </div>

      <!-- 2. 视频金句 (支持新版: narrative_logic.golden_quotes) -->
      <div v-if="result.contentType === 'video' && (result.golden_quotes?.length || result.narrative_logic?.golden_quotes?.length)" class="md:col-span-2 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 p-6 shadow-md ring-1 ring-yellow-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">✨</span> 视频金句
        </h3>
        <div class="space-y-2">
          <div v-for="(quote, idx) in (result.golden_quotes || result.narrative_logic?.golden_quotes || [])" :key="idx" class="flex items-start gap-2">
            <span class="text-amber-500 mt-1">❝</span>
            <p class="text-sm text-gray-700 italic">{{ quote }}</p>
          </div>
        </div>
      </div>

      <!-- 3. 叙事分析 (支持新版: narrative_logic) -->
      <div v-if="result.contentType === 'video' && (result.narrative || result.narrative_logic)" class="md:col-span-1 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-6 shadow-md ring-1 ring-sky-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">📖</span> 叙事分析
        </h3>
        <div class="space-y-3">
          <div>
            <span class="text-xs font-semibold text-sky-600 uppercase">结构</span>
            <p class="text-sm text-gray-900 font-medium">{{ result.narrative?.structure || result.narrative_logic?.structure_type }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-sky-600 uppercase">节奏</span>
            <p class="text-sm text-gray-700">{{ result.narrative?.pacing || result.narrative_logic?.pacing }}</p>
          </div>
          <div v-if="result.narrative?.techniques?.length">
            <span class="text-xs font-semibold text-sky-600 uppercase">技巧</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="tech in result.narrative.techniques" :key="tech" class="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded">{{ tech }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 人货场 (支持新版: ppp_model) -->
      <div v-if="result.contentType === 'video' && (result.ppp || result.ppp_model)" class="md:col-span-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-md ring-1 ring-emerald-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🛒</span> 人货场
        </h3>
        <div class="space-y-3">
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase">👤 人物</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.ppp?.people || result.ppp_model?.people }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase">📍 场景</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.ppp?.place || result.ppp_model?.place }}</p>
          </div>
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase">💎 产品</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.ppp?.product || result.ppp_model?.product }}</p>
          </div>
        </div>
      </div>

      <!-- 5. 人设分析 -->
      <div v-if="result.contentType === 'video' && result.persona" class="md:col-span-1 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-6 shadow-md ring-1 ring-violet-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">👤</span> 人设分析
        </h3>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded">{{ result.persona.type }}</span>
          </div>
          <div v-if="result.persona.traits?.length">
            <span class="text-xs font-semibold text-violet-600 uppercase">人设特点</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="trait in result.persona.traits" :key="trait" class="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded">{{ trait }}</span>
            </div>
          </div>
          <div>
            <span class="text-xs font-semibold text-violet-600 uppercase">信任建立</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.persona.trust_building }}</p>
          </div>
        </div>
      </div>

      <!-- 6. 爆款逻辑 (支持新版: viral_mechanics) -->
      <div v-if="result.contentType === 'video' && (result.viral_logic || result.viral_mechanics)" class="md:col-span-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 p-6 shadow-md ring-1 ring-red-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🔥</span> 爆款逻辑
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 核心逻辑 -->
          <div v-if="result.viral_logic?.core || result.viral_mechanics?.core_logic">
            <span class="text-xs font-semibold text-red-600 uppercase">核心逻辑</span>
            <p class="text-sm text-gray-900 font-medium mt-1">{{ result.viral_logic?.core || result.viral_mechanics?.core_logic }}</p>
          </div>
          <!-- 情绪触发点 -->
          <div v-if="result.viral_logic?.triggers?.length || result.viral_mechanics?.emotional_triggers?.length">
            <span class="text-xs font-semibold text-red-600 uppercase">情绪触发点</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="trigger in (result.viral_logic?.triggers || result.viral_mechanics?.emotional_triggers)" :key="trigger" class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">{{ trigger }}</span>
            </div>
          </div>
          <!-- 可复用元素 -->
          <div v-if="result.viral_logic?.replicable_elements?.length || result.viral_mechanics?.replicable_elements?.length">
            <span class="text-xs font-semibold text-orange-600 uppercase">可复用元素</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="elem in (result.viral_logic?.replicable_elements || result.viral_mechanics?.replicable_elements)" :key="elem" class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">{{ elem }}</span>
            </div>
          </div>
        </div>
        <!-- 调试信息 (关闭) -->
        <div v-if="false" class="mt-4 p-2 bg-gray-100 text-xs text-gray-600 break-all">
          <div>contentType: {{ result.contentType }}</div>
          <div>viral_logic: {{ result.viral_logic ? JSON.stringify(result.viral_logic) : 'undefined' }}</div>
          <div>viral_mechanics: {{ result.viral_mechanics ? JSON.stringify(result.viral_mechanics) : 'undefined' }}</div>
        </div>
      </div>

      <!-- 7. 视觉分析 (支持新版: visual_direction) -->
      <div v-if="result.contentType === 'video' && (result.visual || result.visual_direction)" class="md:col-span-2 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-6 shadow-md ring-1 ring-cyan-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🎬</span> 视觉分析
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="result.visual?.composition || result.visual_direction?.composition_vibe">
            <span class="text-xs font-semibold text-cyan-600 uppercase">画面构图</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.visual?.composition || result.visual_direction?.composition_vibe }}</p>
          </div>
          <div v-if="result.visual?.camera_movement || result.visual_direction?.camera_movement_suggestion">
            <span class="text-xs font-semibold text-cyan-600 uppercase">运镜手法</span>
            <!-- 如果是数组 -->
            <div v-if="Array.isArray(result.visual?.camera_movement)" class="flex flex-wrap gap-1 mt-1">
              <span v-for="cam in result.visual.camera_movement" :key="cam" class="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded">{{ cam }}</span>
            </div>
            <!-- 如果是字符串 -->
            <p v-else class="text-sm text-gray-700 mt-1">{{ result.visual?.camera_movement || result.visual_direction?.camera_movement_suggestion }}</p>
          </div>
          <div v-if="result.visual?.color_tone">
            <span class="text-xs font-semibold text-cyan-600 uppercase">色调风格</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.visual?.color_tone }}</p>
          </div>
          <div v-if="result.visual?.lighting">
            <span class="text-xs font-semibold text-cyan-600 uppercase">光线运用</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.visual?.lighting }}</p>
          </div>
          <div v-if="result.visual_direction?.editing_style">
            <span class="text-xs font-semibold text-cyan-600 uppercase">剪辑风格</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.visual_direction?.editing_style }}</p>
          </div>
          <div v-if="(result.visual?.scenes?.length || result.visual_direction?.suggested_scenes?.length)" class="md:col-span-2">
            <span class="text-xs font-semibold text-cyan-600 uppercase">场景分析</span>
            <div class="flex flex-wrap gap-2 mt-1">
              <span v-for="(scene, idx) in (result.visual?.scenes || result.visual_direction?.suggested_scenes)" :key="idx" class="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">{{ scene }}</span>
            </div>
          </div>
          <!-- 剪辑分析 -->
          <div v-if="result.visual?.editing" class="md:col-span-2 mt-2 pt-2 border-t border-cyan-100">
            <span class="text-xs font-semibold text-blue-600 uppercase">✂️ 剪辑分析</span>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div v-if="result.visual.editing.style">
                <span class="text-xs text-gray-500">风格</span>
                <p class="text-sm text-gray-700">{{ result.visual.editing.style }}</p>
              </div>
              <div v-if="result.visual.editing.techniques?.length">
                <span class="text-xs text-gray-500">技巧</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-for="tech in result.visual.editing.techniques" :key="tech" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{{ tech }}</span>
                </div>
              </div>
              <div v-if="result.visual.editing.transitions?.length">
                <span class="text-xs text-gray-500">转场</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-for="trans in result.visual.editing.transitions" :key="trans" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{{ trans }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 8. 音频分析 (支持新版: audio_atmosphere) -->
      <div v-if="result.contentType === 'video' && (result.audio || result.audio_atmosphere)" class="md:col-span-1 rounded-xl bg-gradient-to-r from-fuchsia-50 to-pink-50 p-6 shadow-md ring-1 ring-fuchsia-200">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-2 text-2xl">🎵</span> 音频分析
        </h3>
        <div class="space-y-3">
          <div v-if="result.audio?.bgm_style || result.audio_atmosphere?.bgm_style">
            <span class="text-xs font-semibold text-fuchsia-600 uppercase">BGM 风格</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.audio?.bgm_style || result.audio_atmosphere?.bgm_style }}</p>
          </div>
          <div v-if="result.audio?.bgm_match">
            <span class="text-xs font-semibold text-fuchsia-600 uppercase">音乐匹配</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.audio?.bgm_match }}</p>
          </div>
          <div v-if="result.audio?.voice_style || result.audio_atmosphere?.voice_tone">
            <span class="text-xs font-semibold text-fuchsia-600 uppercase">人声风格</span>
            <p class="text-sm text-gray-700 mt-1">{{ result.audio?.voice_style || result.audio_atmosphere?.voice_tone }}</p>
          </div>
          <div v-if="(result.audio?.sound_effects?.length || result.audio_atmosphere?.sound_effects?.length)">
            <span class="text-xs font-semibold text-fuchsia-600 uppercase">音效</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="effect in (result.audio?.sound_effects || result.audio_atmosphere?.sound_effects)" :key="effect" class="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-xs rounded">{{ effect }}</span>
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

      <!-- 3. Structure Analysis (Common, adapts position based on type) - 仅当有结构数据时显示 -->
      <div 
        v-if="result.structure && result.structure.length > 0"
        :class="[
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
        
        <!-- 换一个主题输入框 -->
        <div class="mt-6 pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-500 mb-3">💡 想换个主题？输入新的关键词重新生成</p>
          <div class="flex gap-3">
            <input 
              v-model="newTopic"
              type="text" 
              placeholder="例如：护眼仪、智能手表、咖啡机..." 
              class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
              @keyup.enter="handleGenerate"
            />
            <button 
              @click="handleGenerate"
              :disabled="isGenerating || !newTopic.trim()"
              class="whitespace-nowrap rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              换主题生成
            </button>
          </div>
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
