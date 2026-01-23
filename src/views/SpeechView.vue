<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { generateSpeech } from '../services/analysis'

const text = ref('')
const selectedModel = ref('qwen3-tts-flash')
const selectedVoice = ref('Cherry')
const isGenerating = ref(false)
const audioUrl = ref('')
const errorMsg = ref('')

// 模型列表
interface TTSModel {
  id: string
  name: string
  description: string
  voice_count: number
  languages: string
}

interface VoiceItem {
  id: string
  name: string
  description: string
  gender: string
}

const models = ref<TTSModel[]>([
  { id: 'qwen3-tts-flash', name: '通义千问TTS-Flash', description: '官方推荐，49种音色，支持多语言', voice_count: 49, languages: '中/英/法/德/俄/意/西/葡/日/韩' },
  { id: 'qwen-tts', name: '通义千问TTS', description: '标准版，7种音色，仅中英', voice_count: 7, languages: '中/英' }
])

// 动态音色列表
const voices = ref<VoiceItem[]>([])

// qwen3-tts-flash 默认音色
const qwen3Voices: VoiceItem[] = [
  { id: 'Cherry', name: '芊悦', description: '阳光积极、亲切自然小姐姐', gender: 'Female' },
  { id: 'Serena', name: '苏瑶', description: '温柔小姐姐', gender: 'Female' },
  { id: 'Ethan', name: '晨煦', description: '阳光、温暖、活力', gender: 'Male' },
  { id: 'Chelsie', name: '千雪', description: '二次元虚拟女友', gender: 'Female' },
  { id: 'Momo', name: '茉兔', description: '撒娇搞怪，逗你开心', gender: 'Female' },
  { id: 'Vivian', name: '十三', description: '拽拽的、可爱的小暴躁', gender: 'Female' },
  { id: 'Moon', name: '月白', description: '率性帅气', gender: 'Male' },
  { id: 'Maia', name: '四月', description: '知性与温柔的碰撞', gender: 'Female' },
  { id: 'Kai', name: '凯', description: '耳朵的一场SPA', gender: 'Male' },
  { id: 'Nofish', name: '不吃鱼', description: '不会翘舌音的设计师', gender: 'Male' },
  { id: 'Bella', name: '萌宝', description: '喝酒不打醉拳的小萝莉', gender: 'Female' },
  { id: 'Jennifer', name: '詹妮弗', description: '品牌级、电影质感般美语女声', gender: 'Female' },
  { id: 'Ryan', name: '甜茶', description: '节奏拉满，戏感炸裂', gender: 'Male' },
  { id: 'Katerina', name: '卡捷琳娜', description: '御姐音色，韵律回味十足', gender: 'Female' },
  { id: 'Aiden', name: '艾登', description: '精通厨艺的美语大男孩', gender: 'Male' },
  { id: 'Eldric Sage', name: '沧明子', description: '沉稳睿智的老者', gender: 'Male' },
  { id: 'Mia', name: '乖小妹', description: '温顺如春水，乖巧如初雪', gender: 'Female' },
  { id: 'Mochi', name: '沙小弥', description: '聪明伶俐的小大人', gender: 'Male' },
  { id: 'Bellona', name: '燕铮莺', description: '声音洪亮，金戈铁马入梦来', gender: 'Female' },
  { id: 'Vincent', name: '田叔', description: '独特的沙哑烟嗓', gender: 'Male' },
  { id: 'Bunny', name: '萌小姬', description: '萌属性爆棚的小萝莉', gender: 'Female' },
  { id: 'Neil', name: '阿闻', description: '最专业的新闻主持人', gender: 'Male' },
  { id: 'Elias', name: '墨讲师', description: '严谨且具叙事技巧的讲师', gender: 'Female' },
  { id: 'Arthur', name: '徐大爷', description: '质朴嗓音', gender: 'Male' },
  { id: 'Nini', name: '邻家妹妹', description: '糯米糍一样的嗓音', gender: 'Female' },
  { id: 'Ebona', name: '诡婆婆', description: '像生锈的钥匙转动幽暗角落', gender: 'Female' },
  { id: 'Seren', name: '小婉', description: '温和舒缓，助你入睡', gender: 'Female' },
  { id: 'Pip', name: '顽屁小孩', description: '调皮捣蛋却充满童真', gender: 'Male' },
  { id: 'Stella', name: '少女阿月', description: '迷糊少女音与正义感切换', gender: 'Female' },
  { id: 'Bodega', name: '博德加', description: '热情的西班牙大叔', gender: 'Male' },
  { id: 'Sonrisa', name: '索尼莎', description: '热情开朗的拉美大姐', gender: 'Female' },
  { id: 'Alek', name: '阿列克', description: '战斗民族的冷与暖', gender: 'Male' },
  { id: 'Dolce', name: '多尔切', description: '慵懒的意大利大叔', gender: 'Male' },
  { id: 'Sohee', name: '素熙', description: '温柔开朗的韩国欧尼', gender: 'Female' },
  { id: 'Ono Anna', name: '小野杏', description: '鬼灵精怪的青梅竹马', gender: 'Female' },
  { id: 'Lenn', name: '莱恩', description: '穿西装也听后朋克的德国青年', gender: 'Male' },
  { id: 'Emilien', name: '埃米尔安', description: '浪漫的法国大哥哥', gender: 'Male' },
  { id: 'Andre', name: '安德雷', description: '声音磁性，沉稳男生', gender: 'Male' },
  { id: 'Radio Gol', name: '拉迪奥·戈尔', description: '足球解说诗人', gender: 'Male' },
  // 方言音色
  { id: 'Jada', name: '上海-阿珍', description: '风风火火的沪上阿姐', gender: 'Female' },
  { id: 'Dylan', name: '北京-晓东', description: '北京胡同里长大的少年', gender: 'Male' },
  { id: 'Li', name: '南京-老李', description: '耐心的瑜伽老师', gender: 'Male' },
  { id: 'Marcus', name: '陕西-秦川', description: '面宽话短、老陕味', gender: 'Male' },
  { id: 'Roy', name: '闽南-阿杰', description: '诙谐直爽的台湾哥仔', gender: 'Male' },
  { id: 'Peter', name: '天津-李彼得', description: '天津相声，专业捧哏', gender: 'Male' },
  { id: 'Sunny', name: '四川-晴儿', description: '甜到心里的川妹子', gender: 'Female' },
  { id: 'Eric', name: '四川-程川', description: '跳脱市井的成都男子', gender: 'Male' },
  { id: 'Rocky', name: '粤语-阿强', description: '幽默风趣，在线陪聊', gender: 'Male' },
  { id: 'Kiki', name: '粤语-阿清', description: '甜美的港妹闺蜜', gender: 'Female' }
]

// qwen-tts 音色
const qwenVoices: VoiceItem[] = [
  { id: 'longxiaochun', name: '龙小淳', description: '知性女声', gender: 'Female' },
  { id: 'longxiaoxia', name: '龙小夏', description: '温柔女声', gender: 'Female' },
  { id: 'longlaotie', name: '龙老铁', description: '东北男声', gender: 'Male' },
  { id: 'longshu', name: '龙舒', description: '儒雅男声', gender: 'Male' },
  { id: 'longshuo', name: '龙硕', description: '成熟男声', gender: 'Male' },
  { id: 'longyue', name: '龙悦', description: '甜美女声', gender: 'Female' },
  { id: 'longfei', name: '龙飞', description: '激情男声', gender: 'Male' }
]

// 当模型改变时，更新音色列表
watch(selectedModel, (newModel) => {
  if (newModel === 'qwen-tts') {
    voices.value = qwenVoices
    selectedVoice.value = 'longxiaochun'
  } else {
    voices.value = qwen3Voices
    selectedVoice.value = 'Cherry'
  }
})

// 初始化
onMounted(() => {
  voices.value = qwen3Voices
})

// 当前选中的模型信息
const currentModel = computed(() => models.value.find(m => m.id === selectedModel.value))

const handleGenerate = async () => {
  if (!text.value.trim()) return
  
  isGenerating.value = true
  errorMsg.value = ''
  audioUrl.value = ''
  
  try {
    const res = await generateSpeech({
      text: text.value,
      voice: selectedVoice.value,
      model: selectedModel.value
    })
    
    if (res.code === 0 && res.data) {
      // 将 Base64 转换为可播放的 data URI
      audioUrl.value = `data:audio/mp3;base64,${res.data.audio_base64}`
    } else {
      errorMsg.value = res.msg || '生成失败'
    }
  } catch (err) {
    errorMsg.value = '网络请求错误，请稍后重试'
    console.error(err)
  } finally {
    isGenerating.value = false
  }
}

// 下载音频
const downloadAudio = () => {
  if (!audioUrl.value) return
  
  const link = document.createElement('a')
  link.href = audioUrl.value
  link.download = `speech_${Date.now()}.mp3`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 py-10">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">语音合成</h1>
        <p class="mt-2 text-lg text-gray-600">将文本转换为逼真的语音音频，支持多种模型和音色。</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Input & Config -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Model Selection -->
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
            <label class="block text-sm font-medium leading-6 text-gray-900 mb-4">选择模型</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                v-for="model in models" 
                :key="model.id"
                @click="selectedModel = model.id"
                class="relative flex flex-col rounded-xl border p-4 shadow-sm cursor-pointer transition-all"
                :class="selectedModel === model.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-300 bg-white hover:border-gray-400'"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-900">{{ model.name }}</span>
                  <span v-if="model.id === 'qwen3-tts-flash'" class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">推荐</span>
                </div>
                <p class="text-xs text-gray-500">{{ model.description }}</p>
                <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span>{{ model.voice_count }} 音色</span>
                  <span>·</span>
                  <span>{{ model.languages }}</span>
                </div>
                <div v-if="selectedModel === model.id" class="absolute top-2 right-2 text-indigo-600">
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Text Input -->
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
            <label for="text" class="block text-sm font-medium leading-6 text-gray-900 mb-2">输入文本</label>
            <textarea
              id="text"
              v-model="text"
              rows="5"
              class="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 resize-none"
              placeholder="在此输入需要合成语音的文字内容..."
            ></textarea>
            <div class="mt-2 flex justify-between text-xs text-gray-500">
              <span>支持: {{ currentModel?.languages }}</span>
              <span>{{ text.length }} / 10000 字</span>
            </div>
          </div>

          <!-- Voice Selection -->
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
            <label class="block text-sm font-medium leading-6 text-gray-900 mb-4">选择音色 <span class="text-gray-400 font-normal">(共 {{ voices.length }} 种)</span></label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
              <div 
                v-for="voice in voices" 
                :key="voice.id"
                @click="selectedVoice = voice.id"
                class="relative flex items-center space-x-3 rounded-xl border px-4 py-3 shadow-sm cursor-pointer transition-all"
                :class="selectedVoice === voice.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-300 bg-white hover:border-gray-400'"
              >
                <div class="flex-shrink-0">
                  <span class="inline-flex h-9 w-9 items-center justify-center rounded-full" :class="selectedVoice === voice.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'">
                    <svg v-if="voice.gender === 'Male'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ voice.name }}</p>
                  <p class="truncate text-xs text-gray-500">{{ voice.description }}</p>
                </div>
                <div v-if="selectedVoice === voice.id" class="text-indigo-600">
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Generate Button -->
          <div class="flex justify-end">
            <button
              @click="handleGenerate"
              :disabled="!text.trim() || isGenerating"
              class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              <svg v-if="isGenerating" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isGenerating ? '正在合成语音...' : '开始合成' }}
            </button>
          </div>
        </div>

        <!-- Right Column: Result -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 h-full flex flex-col sticky top-24">
            <h3 class="text-base font-semibold leading-6 text-gray-900 mb-4">生成结果</h3>
            
            <div v-if="audioUrl" class="flex-1 flex flex-col items-center justify-center space-y-6 animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse-slow">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </div>
              <audio controls :src="audioUrl" class="w-full"></audio>
              <button 
                @click="downloadAudio"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
              >
                <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载音频
              </button>
            </div>

            <div v-else-if="errorMsg" class="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
                 <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p class="text-sm text-red-600">{{ errorMsg }}</p>
            </div>

            <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-400">
               <svg class="w-14 h-14 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               <p class="text-sm">在左侧输入文本并点击生成<br>音频将在此处播放</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>