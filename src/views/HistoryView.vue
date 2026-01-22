<script setup lang="ts">
import { useProjectStore } from '../stores/project'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const projectStore = useProjectStore()
const { projects, pagination, isLoading } = storeToRefs(projectStore)
const router = useRouter()

const expandedId = ref<string | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const isAllSelected = ref(false)

// 加载项目列表
onMounted(async () => {
  await projectStore.fetchProjects()
})

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr))
}

const formatStatus = (status: string) => {
  const map: Record<string, { text: string; class: string }> = {
    'draft': { text: '草稿', class: 'bg-gray-100 text-gray-700' },
    'analyzed': { text: '已分析', class: 'bg-blue-100 text-blue-700' },
    'completed': { text: '已完成', class: 'bg-green-100 text-green-700' }
  }
  return map[status] || { text: status, class: 'bg-gray-100 text-gray-700' }
}

const formatContentType = (contentType: string | undefined) => {
  const map: Record<string, { text: string; icon: string; class: string }> = {
    'video': { text: '视频', icon: '🎬', class: 'bg-purple-100 text-purple-700' },
    'images': { text: '图文', icon: '🖼️', class: 'bg-orange-100 text-orange-700' },
    'text': { text: '文本', icon: '📝', class: 'bg-gray-100 text-gray-700' }
  }
  return map[contentType || 'images'] || { text: '图文', icon: '🖼️', class: 'bg-orange-100 text-orange-700' }
}

// 从 source_content 中提取标题
const extractTitle = (project: typeof projects.value[0]) => {
  // 优先使用 new_topic（仿写主题）
  if (project.new_topic) {
    return `仿写主题：${project.new_topic}`
  }
  
  // 尝试从 source_content 解析 JSON 获取 title
  if (project.source_content) {
    try {
      const parsed = JSON.parse(project.source_content)
      if (parsed.title) {
        return parsed.title
      }
      // 如果有 content 字段，取前50个字符
      if (parsed.content) {
        return parsed.content.substring(0, 50) + (parsed.content.length > 50 ? '...' : '')
      }
    } catch {
      // 不是 JSON，使用原始内容预览
    }
    return project.source_content.substring(0, 50) + (project.source_content.length > 50 ? '...' : '')
  }
  
  return '无标题'
}

const toggleExpand = (id: string) => {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  isAllSelected.value = selectedIds.value.size === projects.value.length && projects.value.length > 0
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value.clear()
    isAllSelected.value = false
  } else {
    projects.value.forEach(p => selectedIds.value.add(p.id))
    isAllSelected.value = true
  }
}

const handleDelete = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    const result = await projectStore.deleteProject(id)
    if (!result.success) {
      alert(result.message)
    } else {
      if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id)
      }
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.size === 0) return
  
  if (confirm(`确定要删除选中的 ${selectedIds.value.size} 条记录吗？`)) {
    const ids = Array.from(selectedIds.value)
    const result = await projectStore.batchDeleteProjects(ids)
    if (result.success) {
      selectedIds.value.clear()
      isAllSelected.value = false
    } else {
      alert(result.message)
    }
  }
}

const handleClearAll = async () => {
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
    const allIds = projects.value.map(p => p.id)
    const result = await projectStore.batchDeleteProjects(allIds)
    if (!result.success) {
      alert(result.message)
    }
  }
}

const handleRefresh = async () => {
  await projectStore.fetchProjects(pagination.value.page, pagination.value.pageSize)
}

// 跳转到分析页面继续生成
const goToAnalysis = (project: typeof projects.value[0]) => {
  console.log('🚀 [goToAnalysis] 开始跳转:', project.id)
  console.log('🚀 [goToAnalysis] 项目数据:', project)
  console.log('🚀 [goToAnalysis] analysis_result:', project.analysis_result)
  
  // 将项目数据存储到 sessionStorage 以便首页读取
  sessionStorage.setItem('continueProject', JSON.stringify(project))
  console.log('🚀 [goToAnalysis] 已存储到 sessionStorage')
  
  router.push({ name: 'home', query: { continue: project.id } })
  console.log('🚀 [goToAnalysis] 已调用 router.push')
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] flex-col bg-gray-50 p-4 sm:p-8">
    <div class="mx-auto w-full max-w-4xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div v-if="projects.length > 0" class="flex items-center">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">历史记录</h1>
            <p class="mt-2 text-sm text-gray-600">查看您的拆解和仿写历史 (共 {{ pagination.total }} 条)</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="selectedIds.size > 0"
            @click="handleBatchDelete"
            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            删除选中 ({{ selectedIds.size }})
          </button>
          <button
            @click="handleRefresh"
            :disabled="isLoading"
            class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>刷新</span>
          </button>
          <button
            v-if="projects.length > 0"
            @click="handleClearAll"
            class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
          >
            清空历史
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-500">正在加载...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="rounded-full bg-gray-100 p-6">
          <svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="mt-4 text-sm font-semibold text-gray-900">暂无历史记录</h3>
        <p class="mt-1 text-sm text-gray-500">快去拆解一些爆款文案吧！</p>
      </div>

      <!-- History List -->
      <div v-else class="space-y-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="overflow-hidden rounded-lg bg-white shadow transition-all duration-200 hover:shadow-md"
        >
          <!-- Card Header -->
          <div 
            class="cursor-pointer border-l-4 border-indigo-500 p-5"
            @click="toggleExpand(project.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1">
                <!-- Checkbox -->
                <div class="flex items-center h-6" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(project.id)"
                    @change="toggleSelection(project.id)"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  />
                </div>
                
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span :class="['inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', formatContentType(project.content_type).class]">
                      {{ formatContentType(project.content_type).icon }} {{ formatContentType(project.content_type).text }}
                    </span>
                    <span :class="['inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', formatStatus(project.status).class]">
                      {{ formatStatus(project.status).text }}
                    </span>
                    <span class="text-xs text-gray-500">{{ formatDate(project.created_at) }}</span>
                  </div>
                  <h3 class="text-base font-semibold leading-6 text-gray-900 line-clamp-2">
                    {{ extractTitle(project) }}
                  </h3>
                  <p v-if="project.source_url" class="text-xs text-blue-600 truncate">
                    {{ project.source_url }}
                  </p>
                </div>
              </div>
              <div class="ml-4 flex items-center gap-4">
                <!-- Delete Button (Added) -->
                <button
                  @click.stop="handleDelete(project.id)"
                  class="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="删除记录"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  @click.stop="toggleExpand(project.id)"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    class="h-5 w-5 transform transition-transform duration-200"
                    :class="{ 'rotate-180': expandedId === project.id }"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Card Details (Expandable) -->
          <div
            v-if="expandedId === project.id"
            class="border-t border-gray-100 bg-gray-50/50 p-5"
          >
            <div class="grid gap-6 md:grid-cols-2">
              <!-- Left Column: Source Content -->
              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">原文内容</h4>
                  <div class="mt-1 rounded-md bg-gray-100 p-3 text-sm text-gray-600 max-h-40 overflow-y-auto">
                    {{ project.source_content || '无内容' }}
                  </div>
                </div>

                <div v-if="project.source_url">
                  <h4 class="text-sm font-medium text-gray-900">来源链接</h4>
                  <div class="mt-1 rounded-md bg-gray-100 p-3 text-sm break-words">
                    <a :href="project.source_url" target="_blank" class="text-blue-600 hover:underline">
                      {{ project.source_url }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Right Column: Generated Content -->
              <div class="space-y-4">
                <div v-if="project.generated_content">
                  <h4 class="text-sm font-medium text-gray-900">
                    仿写结果 <span v-if="project.new_topic" class="font-normal text-gray-500">({{ project.new_topic }})</span>
                  </h4>
                  <div class="mt-1 whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 max-h-40 overflow-y-auto">
                    {{ project.generated_content }}
                  </div>
                </div>
                <div v-else class="flex h-full items-center justify-center rounded-md border-2 border-dashed border-gray-200 p-4">
                  <p class="text-sm text-gray-400">暂无仿写生成记录</p>
                </div>
              </div>
            </div>

            <!-- Actions Footer -->
            <div class="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                v-if="project.status === 'analyzed' || project.status === 'completed'"
                @click="goToAnalysis(project)"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                查看分析 / 继续生成
              </button>
              <button
                v-else
                @click="goToAnalysis(project)"
                class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                开始分析
              </button>
               <button
                @click="handleDelete(project.id)"
                class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
