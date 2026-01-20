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

export interface AnalysisData {
  contentType: ContentType
  emotions: string[]
  structure: { title: string; description: string }[]
  titleAnalysis?: TitleAnalysisData
  video?: VideoAnalysis
  images?: ImageAnalysisItem[]
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
