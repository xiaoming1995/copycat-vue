import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ContentType = 'text' | 'video' | 'images'

export interface VideoAnalysis {
  shootingTechnique: string // 拍摄手法
  highlight: string // 拍摄爆点
  script: string // 提取的文案
}

export interface ImageAnalysisItem {
  url: string
  shootingTechnique: string
  highlight: string
  composition?: string    // 构图分析
  colorTone?: string      // 色调风格
  mood?: string           // 情绪氛围
  imagePrompt?: string    // AI图像生成提示词
}

export interface TitleAnalysisData {
  original: string
  hooks: string[]
  techniques: string[]
  score: number
}

// 视频分析专属字段
export interface HookAnalysis {
  type: string           // 开头类型
  description: string    // 描述
  duration: string       // 时长
  effectiveness: number  // 有效性评分
}

export interface NarrativeAnalysis {
  structure: string      // 叙事结构
  pacing: string         // 节奏
  techniques: string[]   // 叙事技巧
}

export interface PPPAnalysis {
  people: string         // 人物
  place: string          // 场景
  product: string        // 产品
}

export interface PersonaAnalysis {
  type: string           // 人设类型
  traits: string[]       // 人设特点
  trust_building: string // 信任建立方式
}

export interface ViralLogicAnalysis {
  core: string                   // 核心逻辑
  triggers: string[]             // 触发点
  replicable_elements: string[]  // 可复用元素
}

// 剪辑分析
export interface EditingAnalysis {
  style: string        // 剪辑风格
  techniques: string[] // 剪辑技巧
  transitions: string[] // 转场效果
}

// 视觉分析
export interface VisualAnalysis {
  scenes: string[]               // 场景描述
  composition: string            // 画面构图
  camera_movement: string | string[] // 运镜手法（支持 string 或数组）
  editing?: EditingAnalysis      // 剪辑分析
  color_tone: string             // 色调
  lighting: string               // 光线
}

// 音频分析
export interface AudioAnalysis {
  bgm_style: string      // BGM风格
  bgm_match: string      // BGM与内容匹配度
  voice_style: string    // 人声风格
  sound_effects: string[] // 音效
}

export interface AnalysisData {
  contentType: ContentType
  emotions: string[]
  structure: { title: string; description: string }[]
  titleAnalysis?: TitleAnalysisData
  video?: VideoAnalysis
  images?: ImageAnalysisItem[]
  // 视频专属分析字段（旧版）
  hook?: HookAnalysis
  golden_quotes?: string[]
  narrative?: NarrativeAnalysis
  ppp?: PPPAnalysis
  persona?: PersonaAnalysis
  viral_logic?: ViralLogicAnalysis
  visual?: VisualAnalysis
  audio?: AudioAnalysis
  // 视频专属分析字段（新版）
  hook_strategy?: HookStrategyAnalysis
  narrative_logic?: NarrativeLogicAnalysis
  visual_direction?: VisualDirectionAnalysis
  audio_atmosphere?: AudioAtmosphereAnalysis
  ppp_model?: PPPAnalysis
  viral_mechanics?: ViralMechanicsAnalysis
  tags_and_seo?: TagsAndSEOAnalysis
}

// 新版分析类型
export interface HookStrategyAnalysis {
  type: string
  description: string
  estimated_duration: string
  effectiveness_score: number
}

export interface NarrativeLogicAnalysis {
  structure_type: string
  pacing: string
  golden_quotes: string[]
}

export interface VisualDirectionAnalysis {
  suggested_scenes: string[]
  composition_vibe: string
  camera_movement_suggestion: string
  editing_style: string
}

export interface AudioAtmosphereAnalysis {
  bgm_style: string
  voice_tone: string
  sound_effects: string[]
}

export interface ViralMechanicsAnalysis {
  core_logic: string
  emotional_triggers: string[]
  replicable_elements: string[]
}

export interface TagsAndSEOAnalysis {
  keywords: string[]
  emotion_intensity: number
  word_count: number | string
}

export interface HistoryItem {
  id: string
  timestamp: number
  type: 'url'
  content: string // The original text or URL
  analysis: AnalysisData
  generatedContent?: string
  topic?: string // The topic used for generation
}

export const useHistoryStore = defineStore('history', () => {
  const history = ref<HistoryItem[]>([
    {
      id: '2',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      type: 'url',
      content: 'https://www.xiaohongshu.com/explore/123456',
      analysis: {
        contentType: 'video',
        emotions: ['惊喜', '种草', '实用'],
        structure: [
          { title: '开篇点题', description: '直接展示使用前后的对比图，吸引眼球。' },
          { title: '详细测评', description: '从质地、气味、使用感等方面进行详细描述。' },
          { title: '总结推荐', description: '总结适合的人群和肤质，给出购买建议。' }
        ],
        video: {
          shootingTechnique: '固定机位 + 特写镜头',
          highlight: '展示产品质地时的微距镜头，以及使用前后的同框对比。',
          script: '大家好，今天给大家测评一款风很大的面霜...'
        }
      }
    }
  ])

  function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID()
    history.value.unshift({
      id,
      timestamp: Date.now(),
      ...item
    })
    return id
  }

  function deleteHistory(id: string) {
    history.value = history.value.filter(item => item.id !== id)
  }

  function updateHistory(id: string, updates: Partial<Omit<HistoryItem, 'id' | 'timestamp'>>) {
    const item = history.value.find(item => item.id === id)
    if (item) {
      Object.assign(item, updates)
    }
  }

  function clearHistory() {
    history.value = []
  }

  return {
    history,
    addHistory,
    deleteHistory,
    updateHistory,
    clearHistory
  }
})
