<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AnalysisResult from '../components/AnalysisResult.vue'
import { useProjectStore } from '../stores/project'
import { crawlUrl, type NoteContent } from '../services/crawler'
import { checkProjectByURL } from '../services/project'
import { analyzeContent, analyzeImages, generateContent, type AnalysisResult as AnalysisResultType } from '../services/analysis'
import type { AnalysisData } from '../stores/history'

interface PreviewData {
  title: string
  coverUrl: string
  author: string
  source: 'xiaohongshu' | 'douyin' | 'wechat'
  type: 'video' | 'normal'
  summary: string
  content: string  // 原始内容
  images?: string[]
  tags?: string[]
  stats: {
    likes: number
    comments: number
    collects: number
  }
}

const projectStore = useProjectStore()
const route = useRoute()

const urlContent = ref('')
const isFetching = ref(false)
const isAnalyzing = ref(false)
const isGenerating = ref(false)
const generatedContent = ref('')
const showPreview = ref(false)
const showResult = ref(false)
const showFullContent = ref(false) // 控制是否展示完整内容
const previewData = ref<PreviewData | null>(null)
const crawledNote = ref<NoteContent | null>(null)

// 分析进度状态
type AnalysisStep = 'idle' | 'crawling' | 'analyzingContent' | 'analyzingImages' | 'completed'
const analysisStep = ref<AnalysisStep>('idle')
const analysisProgress = ref({
  currentStep: 0,
  totalSteps: 3,
  imageProgress: { current: 0, total: 0 }
})

// 获取进度文案
const getProgressText = () => {
  switch (analysisStep.value) {
    case 'crawling': return '正在抓取笔记内容...'
    case 'analyzingContent': return '正在分析文案内容...'
    case 'analyzingImages': 
      const { current, total } = analysisProgress.value.imageProgress
      return total > 0 ? `正在分析图片 (${current}/${total})...` : '正在分析图片...'
    case 'completed': return '分析完成'
    default: return ''
  }
}
const errorMsg = ref('')
const currentProjectId = ref<string | null>(null) // 当前项目ID
const llmAnalysisResult = ref<AnalysisResultType | null>(null) // LLM 分析结果
const lastGeneratedTopic = ref('') // 上次生成的主题，用于避免重复生成

// 图片预览相关
const showImagePreview = ref(false)
const currentImageIndex = ref(0)
const previewImages = ref<string[]>([])

// 打开图片预览
const openImagePreview = (images: string[], index: number) => {
  previewImages.value = images
  currentImageIndex.value = index
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
}

// 上一张图片
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  } else {
    currentImageIndex.value = previewImages.value.length - 1
  }
}

// 下一张图片
const nextImage = () => {
  if (currentImageIndex.value < previewImages.value.length - 1) {
    currentImageIndex.value++
  } else {
    currentImageIndex.value = 0
  }
}

// 分析结果数据
const analysisData = ref<AnalysisData>({
  contentType: 'text',
  emotions: [],
  structure: []
})

// 处理从历史记录跳转过来的情况
onMounted(() => {
  const continueId = route.query.continue as string
  if (continueId) {
    const projectData = sessionStorage.getItem('continueProject')
    if (projectData) {
      try {
        const project = JSON.parse(projectData)
        sessionStorage.removeItem('continueProject') // 清除缓存
        
        // 恢复项目状态
        currentProjectId.value = project.id
        urlContent.value = project.source_url || ''
        
        // 检查是否有分析结果（支持状态判断和内容判断）
        const hasAnalysis = project.status === 'analyzed' || project.status === 'completed' ||
          (project.analysis_result && Object.keys(project.analysis_result).length > 0)
        
        if (hasAnalysis && project.analysis_result) {
          const result = project.analysis_result as AnalysisResultType
          llmAnalysisResult.value = result
          
          console.log('📦 [历史加载] 项目数据:', project)
          console.log('📦 [历史加载] analysis_result:', project.analysis_result)
          console.log('📦 [历史加载] source_content:', project.source_content)
          
          // 尝试从分析结果中获取图片数据
          const imageAnalysis = (result as unknown as Record<string, unknown>).image_analysis as { images?: Array<Record<string, unknown>> } | undefined
          const storedImages = imageAnalysis?.images || []
          console.log('📷 [历史加载] imageAnalysis:', imageAnalysis)
          console.log('📷 [历史加载] storedImages:', storedImages)
          
          // 尝试从 source_content 中提取内容（如果存储了的话）
          let imageUrls: string[] = []
          let textContent = '' // 用于存储实际文案内容
          try {
            const sourceData = JSON.parse(project.source_content || '{}')
            console.log('📷 [历史加载] sourceData:', sourceData)
            if (Array.isArray(sourceData.images)) {
              imageUrls = sourceData.images
            }
            // 提取文案内容（用于视频脚本显示）
            if (typeof sourceData.content === 'string') {
              textContent = sourceData.content
            }
          } catch {
            // source_content 可能是纯文本，直接使用
            console.log('📷 [历史加载] source_content 不是 JSON，作为纯文本处理')
            textContent = project.source_content || ''
          }
          console.log('📷 [历史加载] imageUrls:', imageUrls)
          
          // 设置分析数据
          // 根据项目的 content_type 判断类型，支持多种推断方式
          let projectContentType: 'video' | 'images' = 'images'
          
          // 1. 优先使用项目的 content_type 字段
          if (project.content_type === 'video') {
            projectContentType = 'video'
          }
          // 2. 其次从分析结果中的视频专属字段推断（支持新旧两版字段名）
          else if (
            // 旧版字段名
            (result as any).hook || (result as any).visual || (result as any).audio || 
            (result as any).narrative || (result as any).ppp || (result as any).persona || 
            (result as any).viral_logic ||
            // 新版字段名
            (result as any).hook_strategy || (result as any).visual_direction || 
            (result as any).audio_atmosphere || (result as any).narrative_logic || 
            (result as any).ppp_model || (result as any).viral_mechanics
          ) {
            // 如果有视频专属分析字段，判断为视频类型
            projectContentType = 'video'
          }
          
          console.log('📦 [历史加载] 判断内容类型:', projectContentType, 'project.content_type:', project.content_type)
          
          analysisData.value = {
            contentType: projectContentType,
            emotions: result.emotion?.tags || (result as any).viral_mechanics?.emotional_triggers || [],
            structure: result.structure || [],
            titleAnalysis: result.title_analysis ? {
              original: result.title_analysis.original,
              hooks: result.title_analysis.hooks,
              techniques: result.title_analysis.techniques,
              score: result.title_analysis.score
            } : undefined,
            // 视频专属分析字段（从分析结果中透传 - 旧版）
            hook: (result as any).hook,
            golden_quotes: (result as any).golden_quotes,
            narrative: (result as any).narrative,
            ppp: (result as any).ppp,
            persona: (result as any).persona,
            viral_logic: (result as any).viral_logic,
            visual: (result as any).visual,
            audio: (result as any).audio,
            // 视频专属分析字段（新版）
            hook_strategy: (result as any).hook_strategy,
            narrative_logic: (result as any).narrative_logic,
            visual_direction: (result as any).visual_direction,
            audio_atmosphere: (result as any).audio_atmosphere,
            ppp_model: (result as any).ppp_model,
            viral_mechanics: (result as any).viral_mechanics,
            tags_and_seo: (result as any)['tags_&_seo'],
            // 视频数据（仅视频类型）
            ...(projectContentType === 'video' ? {
              video: {
                shootingTechnique: '基于 AI 分析的拍摄技巧',
                highlight: result.emotion?.primary || '情绪亮点',
                script: textContent.substring(0, 200) || ''
              }
            } : {
              // 图片数据（仅图文类型）
              images: imageUrls.map((url, index) => {
                const imgData = storedImages[index] || {}
                return {
                  url,
                  shootingTechnique: (imgData.technique as string) || `图片 ${index + 1}`,
                  highlight: (imgData.highlight as string) || '视觉亮点',
                  composition: imgData.composition as string | undefined,
                  colorTone: imgData.color_tone as string | undefined,
                  mood: imgData.mood as string | undefined,
                  imagePrompt: imgData.image_prompt as string | undefined
                }
              })
            })
          }
          console.log('📦 [历史加载] 最终 analysisData:', analysisData.value)
          
          // 恢复已生成的内容
          if (project.generated_content) {
            generatedContent.value = project.generated_content
            lastGeneratedTopic.value = project.new_topic || ''
          }
          
          // 显示分析结果页
          showResult.value = true
        }
      } catch (e) {
        console.error('解析历史项目数据失败:', e)
      }
    }
  }
})

// 从分享文本中提取小红书链接
function extractXhsUrl(input: string): string | null {
  // 匹配小红书相关的URL模式
  const patterns = [
    // 标准链接：xiaohongshu.com/explore/xxx 或 xiaohongshu.com/discovery/item/xxx
    /https?:\/\/(?:www\.)?xiaohongshu\.com\/(?:explore|discovery\/item)\/[a-zA-Z0-9]+[^\s]*/,
    // 短链接：xhslink.com/xxx
    /https?:\/\/xhslink\.com\/[a-zA-Z0-9]+[^\s]*/
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) {
      // 清理URL末尾可能的特殊字符
      return match[0].replace(/[，。！？、）】》\s]+$/, '')
    }
  }
  
  return null
}

// 爬取内容
const handleFetch = async () => {
  if (!urlContent.value.trim()) {
    errorMsg.value = '请输入文章链接'
    return
  }

  errorMsg.value = ''
  
  // 尝试从输入中提取小红书链接
  const extractedUrl = extractXhsUrl(urlContent.value.trim())
  const finalUrl = extractedUrl || urlContent.value.trim()
  
  // 如果提取到了链接，自动更新输入框显示
  if (extractedUrl && extractedUrl !== urlContent.value.trim()) {
    urlContent.value = extractedUrl
  }
  
  isFetching.value = true

  try {
    const response = await crawlUrl(finalUrl)
    
    if (response.code === 0 && response.data?.success && response.data.content) {
      const note = response.data.content
      crawledNote.value = note
      
      // 构建预览数据
      previewData.value = {
        title: note.title || '无标题',
        coverUrl: note.cover_url || note.images?.[0] || 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400',
        author: note.author_name || '未知作者',
        source: 'xiaohongshu',
        type: note.type,
        summary: note.content?.substring(0, 150) + (note.content?.length > 150 ? '...' : '') || '',
        content: note.content || '',
        images: note.images,
        tags: note.tags,
        stats: {
          likes: note.like_count || 0,
          comments: note.comment_count || 0,
          collects: note.collect_count || 0
        }
      }
      
      showPreview.value = true
    } else {
      errorMsg.value = response.data?.error || response.msg || '爬取失败，请检查链接是否正确'
    }
  } catch (error) {
    console.error('爬取失败:', error)
    errorMsg.value = '网络错误，请稍后重试'
  } finally {
    isFetching.value = false
  }
}

// 确认并分析内容
const handleConfirmAnalyze = async () => {
  if (!previewData.value || !crawledNote.value) return
  
  isAnalyzing.value = true
  analysisStep.value = 'crawling'
  errorMsg.value = ''

  try {
    // 先检查是否已有相同链接的分析结果
    const existingCheck = await checkProjectByURL(urlContent.value)
    if (existingCheck.code === 0 && existingCheck.data && existingCheck.data.analysis_result) {
      console.log('✅ 发现已有分析结果，复用缓存')
      
      // 使用已有的项目和分析结果
      currentProjectId.value = existingCheck.data.id
      
      // 解析已有的分析结果
      const cachedResult = existingCheck.data.analysis_result as unknown as AnalysisResultType
      llmAnalysisResult.value = cachedResult
      
      // 转换为前端显示格式
      analysisData.value = {
        contentType: crawledNote.value.type === 'video' ? 'video' : 'images',
        emotions: cachedResult.emotion?.tags || (cachedResult as any).viral_mechanics?.emotional_triggers || [],
        structure: cachedResult.structure || [],
        titleAnalysis: cachedResult.title_analysis ? {
          original: cachedResult.title_analysis.original,
          hooks: cachedResult.title_analysis.hooks,
          techniques: cachedResult.title_analysis.techniques,
          score: cachedResult.title_analysis.score
        } : undefined,
        // 视频专属分析字段（从缓存结果中透传 - 旧版）
        hook: (cachedResult as any).hook,
        golden_quotes: (cachedResult as any).golden_quotes,
        narrative: (cachedResult as any).narrative,
        ppp: (cachedResult as any).ppp,
        persona: (cachedResult as any).persona,
        viral_logic: (cachedResult as any).viral_logic,
        visual: (cachedResult as any).visual,
        audio: (cachedResult as any).audio,
        // 视频专属分析字段（新版）
        hook_strategy: (cachedResult as any).hook_strategy,
        narrative_logic: (cachedResult as any).narrative_logic,
        visual_direction: (cachedResult as any).visual_direction,
        audio_atmosphere: (cachedResult as any).audio_atmosphere,
        ppp_model: (cachedResult as any).ppp_model,
        viral_mechanics: (cachedResult as any).viral_mechanics,
        tags_and_seo: (cachedResult as any)['tags_&_seo'],
        ...(crawledNote.value.type === 'video' ? {
          video: {
            shootingTechnique: '基于 AI 分析的拍摄技巧',
            highlight: cachedResult.emotion?.primary || '情绪亮点',
            script: crawledNote.value.content?.substring(0, 200) || ''
          }
        } : {
          images: (crawledNote.value.images || []).map((url, index) => ({
            url,
            shootingTechnique: cachedResult.structure?.[index]?.title || `图片 ${index + 1}`,
            highlight: cachedResult.keywords?.[index % cachedResult.keywords.length] || '关键词'
          }))
        })
      }
      
      // 复用已生成的内容
      if (existingCheck.data.generated_content) {
        generatedContent.value = existingCheck.data.generated_content
        lastGeneratedTopic.value = existingCheck.data.new_topic || ''
      }
      
      showResult.value = true
      showPreview.value = false
      isAnalyzing.value = false
      return
    }

    // 没有缓存，创建新项目（将图片 URL 也保存以便后续恢复）
    const sourceData = {
      content: crawledNote.value.content || '',
      images: crawledNote.value.images || [],
      type: crawledNote.value.type || 'image'
    }
    const result = await projectStore.createProject({
      source_url: urlContent.value,
      source_content: JSON.stringify(sourceData),
      content_type: crawledNote.value.type === 'video' ? 'video' : 'images'
    })

    if (!result.success) {
      errorMsg.value = result.message
      isAnalyzing.value = false
      return
    }

    // 保存项目ID
    currentProjectId.value = result.project?.id || null

    // 尝试调用后端 LLM 分析 API
    analysisStep.value = 'analyzingContent'
    let useLLMAnalysis = false
    if (currentProjectId.value && crawledNote.value.content) {
      try {
        const analysisResponse = await analyzeContent({
          title: previewData.value?.title || '',
          content: crawledNote.value.content,
          project_id: currentProjectId.value,
          content_type: crawledNote.value.type === 'video' ? 'video' : 'text'
        })
        
        if (analysisResponse.code === 0 && analysisResponse.data) {
          // 使用 LLM 分析结果
          llmAnalysisResult.value = analysisResponse.data
          useLLMAnalysis = true
          
          // 转换为前端显示格式
          analysisData.value = {
            contentType: crawledNote.value.type === 'video' ? 'video' : 'images',
            emotions: analysisResponse.data.emotion?.tags || (analysisResponse.data as any).viral_mechanics?.emotional_triggers || [],
            structure: analysisResponse.data.structure || [],
            titleAnalysis: analysisResponse.data.title_analysis ? {
              original: analysisResponse.data.title_analysis.original,
              hooks: analysisResponse.data.title_analysis.hooks,
              techniques: analysisResponse.data.title_analysis.techniques,
              score: analysisResponse.data.title_analysis.score
            } : undefined,
            // 视频专属分析字段（从后端直接透传 - 旧版）
            hook: (analysisResponse.data as any).hook,
            golden_quotes: (analysisResponse.data as any).golden_quotes,
            narrative: (analysisResponse.data as any).narrative,
            ppp: (analysisResponse.data as any).ppp,
            persona: (analysisResponse.data as any).persona,
            viral_logic: (analysisResponse.data as any).viral_logic,
            visual: (analysisResponse.data as any).visual,
            audio: (analysisResponse.data as any).audio,
            // 视频专属分析字段（新版）
            hook_strategy: (analysisResponse.data as any).hook_strategy,
            narrative_logic: (analysisResponse.data as any).narrative_logic,
            visual_direction: (analysisResponse.data as any).visual_direction,
            audio_atmosphere: (analysisResponse.data as any).audio_atmosphere,
            ppp_model: (analysisResponse.data as any).ppp_model,
            viral_mechanics: (analysisResponse.data as any).viral_mechanics,
            tags_and_seo: (analysisResponse.data as any)['tags_&_seo'],
            ...(crawledNote.value.type === 'video' ? {
              video: {
                shootingTechnique: '基于 AI 分析的拍摄技巧',
                highlight: analysisResponse.data.emotion?.primary || '情绪亮点',
                script: crawledNote.value.content?.substring(0, 200) || ''
              }
            } : {
              images: (crawledNote.value.images || []).map((url, index) => ({
                url,
                shootingTechnique: analysisResponse.data?.structure?.[index]?.title || `图片 ${index + 1}`,
                highlight: analysisResponse.data?.keywords?.[index % (analysisResponse.data?.keywords?.length || 1)] || '关键词'
              }))
            })
          }
          
          // 如果是图文类型且有图片，尝试进行多模态图片分析
          if (crawledNote.value.type !== 'video' && crawledNote.value.images && crawledNote.value.images.length > 0) {
            try {
              console.log('🖼️ 尝试进行多模态图片分析...')
              analysisStep.value = 'analyzingImages'
              analysisProgress.value.imageProgress = { current: 0, total: crawledNote.value.images.length }
              
              const imageAnalysisResponse = await analyzeImages({
                images: crawledNote.value.images, // 分析所有图片
                project_id: currentProjectId.value || undefined
              })
              
              if (imageAnalysisResponse.code === 0 && imageAnalysisResponse.data?.images) {
                console.log('✅ 多模态图片分析成功')
                console.log('📊 原始图片分析数据:', JSON.stringify(imageAnalysisResponse.data.images, null, 2))
                // 合并图片分析结果
                const imageResults = imageAnalysisResponse.data.images
                analysisData.value.images = (crawledNote.value.images || []).map((url, index) => {
                  const imgAnalysis = imageResults.find(r => r.index === index + 1) || imageResults[index]
                  console.log(`📷 图片 ${index + 1} 分析:`, imgAnalysis)
                  console.log(`   - image_prompt:`, imgAnalysis?.image_prompt)
                  return {
                    url,
                    shootingTechnique: imgAnalysis?.technique || `图片 ${index + 1}`,
                    highlight: imgAnalysis?.highlight || '视觉亮点',
                    composition: imgAnalysis?.composition,
                    colorTone: imgAnalysis?.color_tone,
                    mood: imgAnalysis?.mood,
                    imagePrompt: imgAnalysis?.image_prompt
                  }
                })
                console.log('📦 最终 analysisData.images:', JSON.stringify(analysisData.value.images, null, 2))
              }
            } catch (imageError) {
              console.warn('多模态图片分析失败（可能模型不支持）:', imageError)
              // 继续使用文案分析结果填充图片信息
            }
          }
        }
      } catch (llmError) {
        console.warn('LLM 分析失败，使用本地模拟:', llmError)
      }
    }

    // 如果 LLM 分析失败，使用本地模拟
    if (!useLLMAnalysis) {
      if (crawledNote.value.type === 'video') {
        analysisData.value = {
          contentType: 'video',
          emotions: extractEmotions(crawledNote.value.content || ''),
          structure: generateStructure(crawledNote.value.content || ''),
          video: {
            shootingTechnique: '固定机位 + 局部特写 + 快速剪辑',
            highlight: '视觉冲击力强的对比展示',
            script: crawledNote.value.content?.substring(0, 200) || ''
          }
        }
      } else {
        analysisData.value = {
          contentType: 'images',
          emotions: extractEmotions(crawledNote.value.content || ''),
          structure: generateStructure(crawledNote.value.content || ''),
          images: (crawledNote.value.images || []).map((url, index) => {
            const techniques = ['自然光拍摄', '大光圈虚化', '俯拍视角']
            const highlights = ['氛围感营造', '焦点引导', '全貌展示']
            return {
              url,
              shootingTechnique: techniques[index % 3] as string,
              highlight: highlights[index % 3] as string
            }
          })
        }
      }
    }

    showResult.value = true
    showPreview.value = false
  } catch (error) {
    console.error('分析失败:', error)
    errorMsg.value = '分析失败，请稍后重试'
  } finally {
    isAnalyzing.value = false
  }
}

// 提取情绪关键词（简单实现）
function extractEmotions(_content: string): string[] {
  const emotionKeywords = ['惊喜', '种草', '实用', '治愈', '清新', '高级', '氛围感', '真实', '干货']
  return emotionKeywords.filter(() => Math.random() > 0.5).slice(0, 4)
}

// 生成结构分析（简单实现）
function generateStructure(_content: string): { title: string; description: string }[] {
  const structures = [
    { title: '开篇引入', description: '吸引注意力的开场白，建立与读者的连接' },
    { title: '痛点挖掘', description: '引发共鸣，说出用户的困扰' },
    { title: '解决方案', description: '提供价值，展示产品或方法' },
    { title: '情感升华', description: '总结收尾，引导行动' }
  ]
  return structures.slice(0, 3 + Math.floor(Math.random() * 2))
}

const handleCancelPreview = () => {
  showPreview.value = false
  showFullContent.value = false
  previewData.value = null
  crawledNote.value = null
  errorMsg.value = ''
}

const handleBack = () => {
  showResult.value = false
  urlContent.value = ''
  crawledNote.value = null
  generatedContent.value = ''
}

const handleGenerate = async (topic: string, forceRegenerate = false) => {
  if (!currentProjectId.value) {
    alert('请先完成内容分析')
    return
  }

  // 如果主题相同且已有生成内容，且不是强制重新生成，则跳过
  if (topic === lastGeneratedTopic.value && generatedContent.value && !forceRegenerate) {
    console.log('跳过重复生成，主题:', topic)
    return
  }

  isGenerating.value = true

  try {
    const response = await generateContent({
      project_id: currentProjectId.value,
      new_topic: topic
    })

    if (response.code === 0 && response.data) {
      // 支持多条生成结果
      if (response.data.generated_contents && response.data.generated_contents.length > 1) {
        // 多条内容用分隔符展示
        generatedContent.value = response.data.generated_contents
          .map((content: string, index: number) => `【方案 ${index + 1}】\n${content}`)
          .join('\n\n' + '─'.repeat(40) + '\n\n')
      } else if (response.data.generated_content) {
        generatedContent.value = response.data.generated_content
      }
      lastGeneratedTopic.value = topic
    } else {
      // 回退到模拟生成
      generatedContent.value = `【${topic}】文案示例：\n\n这也是一个基于深层逻辑重构的全新文案。\n\n1. 场景：你是否也遇到了这样的困扰？\n2. 痛点：如果不解决，后果很严重！\n3. 解决方案：这款产品正好能帮到你。\n\n(模拟生成结果 - 请在配置中心设置 API Key 以使用 AI 生成)`
      lastGeneratedTopic.value = topic
    }
  } catch (error) {
    console.error('生成失败:', error)
    // 模拟生成
    generatedContent.value = `【${topic}】文案示例：\n\n这也是一个基于深层逻辑重构的全新文案。\n\n1. 场景：你是否也遇到了这样的困扰？\n2. 痛点：如果不解决，后果很严重！\n3. 解决方案：这款产品正好能帮到你。\n\n(模拟生成结果)`
    lastGeneratedTopic.value = topic
  } finally {
    isGenerating.value = false
  }
}

// 格式化来源显示
const formatSource = (source: string) => {
  const map: Record<string, string> = {
    'xiaohongshu': '小红书',
    'douyin': '抖音',
    'wechat': '公众号'
  }
  return map[source] || source
}
</script>

<template>
  <main class="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-gray-50 p-4 sm:p-8">
    <div class="w-full max-w-3xl space-y-8">
      <!-- Header (Hidden when showing result) -->
      <div v-if="!showResult && !showPreview" class="text-center transition-all duration-300">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">CopyCat 爆款文案助手</h1>
        <p class="mt-4 text-lg text-gray-600">深度拆解爆款逻辑，一键生成神似文案</p>
      </div>

      <!-- Result View -->
      <AnalysisResult 
        v-if="showResult" 
        :result="analysisData"
        :is-generating="isGenerating"
        :generated-content="generatedContent"
        @back="handleBack"
        @generate="(topic: string, forceRegenerate?: boolean) => handleGenerate(topic, forceRegenerate ?? false)"
      />

      <!-- Preview Card -->
      <div v-else-if="showPreview && previewData" class="rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-fade-in">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6">内容抓取成功，请确认</h2>
          
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Cover Image -->
            <div class="w-full md:w-1/3 flex-shrink-0">
              <div class="aspect-video md:aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                <img :src="previewData.coverUrl" alt="Cover" class="w-full h-full object-cover" />
                <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                  {{ previewData.type === 'video' ? '视频' : '图文' }}
                </div>
              </div>
            </div>
            
            <!-- Details -->
            <div class="flex-1 space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">{{ previewData.title }}</h3>
                <div class="mt-2 flex items-center text-sm text-gray-500 gap-4">
                  <span class="flex items-center">
                    <span class="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    {{ formatSource(previewData.source) }}
                  </span>
                  <span>作者：{{ previewData.author }}</span>
                </div>
              </div>
              
              <!-- 统计数据 -->
              <div class="flex gap-4 text-sm text-gray-500">
                <span>❤️ {{ previewData.stats.likes }}</span>
                <span>💬 {{ previewData.stats.comments }}</span>
                <span>⭐ {{ previewData.stats.collects }}</span>
              </div>

              <!-- 标签 -->
              <div v-if="previewData.tags?.length" class="flex flex-wrap gap-2">
                <span 
                  v-for="tag in previewData.tags.slice(0, 5)" 
                  :key="tag"
                  class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                >
                  #{{ tag }}
                </span>
              </div>
              
              <!-- 内容预览/完整内容 -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-medium text-gray-500">笔记正文</span>
                  <button
                    @click="showFullContent = !showFullContent"
                    class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {{ showFullContent ? '收起' : '展开全部' }}
                  </button>
                </div>
                <p 
                  class="text-sm text-gray-600 whitespace-pre-wrap"
                  :class="{ 'line-clamp-4': !showFullContent, 'max-h-60 overflow-y-auto': showFullContent }"
                >{{ previewData.content || previewData.summary }}</p>
              </div>

              <!-- 视频展示（始终显示，不需要展开） -->
              <div v-if="crawledNote?.type === 'video' && crawledNote?.video?.url" class="mt-4 bg-gray-50 p-4 rounded-lg">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-sm font-medium text-gray-700">🎬 视频内容</span>
                  <span class="text-xs text-gray-500" v-if="crawledNote.video.duration">
                    时长: {{ Math.floor(crawledNote.video.duration / 60) }}:{{ String(crawledNote.video.duration % 60).padStart(2, '0') }}
                  </span>
                </div>
                <div class="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <video 
                    :src="crawledNote.video.url" 
                    :poster="crawledNote.video.cover_url || crawledNote.cover_url"
                    controls
                    class="w-full h-full object-contain"
                    preload="metadata"
                  >
                    您的浏览器不支持 video 标签
                  </video>
                </div>
              </div>
              <!-- 视频封面（当没有视频URL但是视频类型时） -->
              <div v-else-if="crawledNote?.type === 'video'" class="mt-4 bg-gray-50 p-4 rounded-lg">
                <span class="text-sm font-medium text-gray-700 block mb-3">🎬 视频封面</span>
                <div class="relative rounded-lg overflow-hidden bg-gray-100">
                  <img :src="crawledNote.cover_url" alt="视频封面" class="w-full max-h-80 object-contain" />
                  <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span class="text-white text-sm bg-black/50 px-3 py-1 rounded">视频内容（请在小红书APP内观看）</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 展开时显示更多详细信息（移到flex布局外部） -->
          <div v-if="showFullContent" class="mt-6 space-y-4 border-t pt-6">
            <!-- 图片列表 -->
            <div v-if="previewData.images?.length">
              <span class="text-sm font-medium text-gray-700">全部图片 ({{ previewData.images.length }} 张) - 点击查看大图</span>
              <div class="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                <div 
                  v-for="(img, idx) in previewData.images" 
                  :key="idx"
                  @click="openImagePreview(previewData.images!, idx)"
                  class="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-105 transition-all"
                >
                  <img :src="img" :alt="`图片${idx + 1}`" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <!-- 视频展示 -->
            <div v-if="crawledNote?.type === 'video' && crawledNote?.video?.url" class="mt-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-sm font-medium text-gray-700">🎬 视频内容</span>
                <span class="text-xs text-gray-500" v-if="crawledNote.video.duration">
                  时长: {{ Math.floor(crawledNote.video.duration / 60) }}:{{ String(crawledNote.video.duration % 60).padStart(2, '0') }}
                </span>
              </div>
              <div class="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video 
                  :src="crawledNote.video.url" 
                  :poster="crawledNote.video.cover_url || crawledNote.cover_url"
                  controls
                  class="w-full h-full object-contain"
                  preload="metadata"
                >
                  您的浏览器不支持 video 标签
                </video>
              </div>
            </div>
            <!-- 视频封面（当没有视频URL但有封面时） -->
            <div v-else-if="crawledNote?.type === 'video' && crawledNote?.cover_url && !crawledNote?.video?.url" class="mt-4">
              <span class="text-sm font-medium text-gray-700 block mb-3">🎬 视频封面</span>
              <div class="relative rounded-lg overflow-hidden bg-gray-100">
                <img :src="crawledNote.cover_url" alt="视频封面" class="w-full max-h-80 object-contain" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span class="text-white text-sm">视频内容（暂无直接链接）</span>
                </div>
              </div>
            </div>
            
            <!-- 来源链接 -->
            <div v-if="urlContent" class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">来源链接：</span>
              <a 
                :href="urlContent" 
                target="_blank" 
                class="text-sm text-blue-600 hover:underline break-all"
              >
                {{ urlContent }}
              </a>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 mt-6 pt-4 border-t">
            <button
              @click="handleCancelPreview"
              class="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              取消/重新抓取
            </button>
            <button
              @click="handleConfirmAnalyze"
              :disabled="isAnalyzing"
              class="flex-1 flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <svg v-if="isAnalyzing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isAnalyzing ? getProgressText() : '确认并分析' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Input Card -->
      <div v-else class="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-300">
        <div class="p-6 sm:p-8">
          <div class="space-y-6">
            <div>
              <label for="url" class="block text-sm font-medium leading-6 text-gray-900">文章链接</label>
              <div class="relative mt-2 rounded-md shadow-sm">
                <input
                  type="url"
                  id="url"
                  v-model="urlContent"
                  class="block w-full rounded-md border-0 py-4 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="支持小红书笔记链接"
                />
              </div>
              <p class="mt-2 text-sm text-gray-500">我们将自动抓取文章内容进行分析。</p>
              
              <!-- 错误提示 -->
              <div v-if="errorMsg" class="mt-3 rounded-md bg-red-50 p-3">
                <p class="text-sm text-red-600">{{ errorMsg }}</p>
              </div>
              
              <div class="mt-4 rounded-md bg-blue-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1 md:flex md:justify-between">
                    <p class="text-sm text-blue-700">支持小红书笔记链接：www.xiaohongshu.com/explore/xxx</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-8">
            <button
              type="button"
              @click="handleFetch"
              :disabled="isFetching"
              class="flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg
                v-if="isFetching"
                class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isFetching ? '正在获取内容...' : '开始抓取' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <h3 class="font-semibold text-gray-900">情绪分析</h3>
          <p class="mt-1 text-sm text-gray-500">精准识别文案情绪基调</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <h3 class="font-semibold text-gray-900">结构拆解</h3>
          <p class="mt-1 text-sm text-gray-500">可视化展示行文逻辑</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <h3 class="font-semibold text-gray-900">神似仿写</h3>
          <p class="mt-1 text-sm text-gray-500">保留灵魂，重塑骨肉</p>
        </div>
      </div>
    </div>
  </main>

  <!-- 图片预览模态框 -->
  <Teleport to="body">
    <div 
      v-if="showImagePreview" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="closeImagePreview"
      @keydown.esc="closeImagePreview"
      @keydown.left="prevImage"
      @keydown.right="nextImage"
      tabindex="0"
      ref="imagePreviewRef"
    >
      <!-- 关闭按钮 -->
      <button 
        @click="closeImagePreview"
        class="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 图片计数 -->
      <div class="absolute top-4 left-4 text-white/80 text-sm">
        {{ currentImageIndex + 1 }} / {{ previewImages.length }}
      </div>

      <!-- 上一张按钮 -->
      <button 
        v-if="previewImages.length > 1"
        @click="prevImage"
        class="absolute left-4 p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- 大图显示 -->
      <div class="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        <img 
          :src="previewImages[currentImageIndex]" 
          :alt="`图片 ${currentImageIndex + 1}`"
          class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      <!-- 下一张按钮 -->
      <button 
        v-if="previewImages.length > 1"
        @click="nextImage"
        class="absolute right-4 p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- 缩略图导航 -->
      <div 
        v-if="previewImages.length > 1" 
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-4"
      >
        <div 
          v-for="(img, idx) in previewImages" 
          :key="idx"
          @click="currentImageIndex = idx"
          class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all"
          :class="idx === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'"
        >
          <img :src="img" :alt="`缩略图 ${idx + 1}`" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
