<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { createBatchAnalyze, getBatchStatus, type BatchTaskStatus } from '../services/batch'

// 输入的链接文本
const urlsText = ref('')

// 解析后的链接列表
const parsedUrls = computed(() => {
  return urlsText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('http'))
})

// 任务状态
const isSubmitting = ref(false)
const currentTask = ref<BatchTaskStatus | null>(null)
const pollingTimer = ref<number | null>(null)
const errorMessage = ref('')

// 提交批量任务
const handleSubmit = async () => {
  if (parsedUrls.value.length === 0) {
    errorMessage.value = '请输入至少一个有效链接'
    return
  }

  if (parsedUrls.value.length > 10) {
    errorMessage.value = '单次最多支持10个链接'
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true

  const result = await createBatchAnalyze(parsedUrls.value)

  if (result.success && result.data) {
    currentTask.value = {
      batch_id: result.data.batch_id,
      total_count: result.data.total_count,
      success_count: 0,
      failed_count: 0,
      status: result.data.status
    }
    // 开始轮询状态
    startPolling(result.data.batch_id)
  } else {
    errorMessage.value = result.message || '创建任务失败'
  }

  isSubmitting.value = false
}

// 开始轮询任务状态
const startPolling = (batchId: string) => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
  }

  pollingTimer.value = window.setInterval(async () => {
    const result = await getBatchStatus(batchId)
    if (result.success && result.data) {
      currentTask.value = result.data

      // 任务完成，停止轮询
      if (result.data.status === 'completed' || result.data.status === 'failed') {
        stopPolling()
      }
    }
  }, 2000) // 每2秒轮询一次
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// 重新开始
const handleReset = () => {
  urlsText.value = ''
  currentTask.value = null
  errorMessage.value = ''
  stopPolling()
}

// 进度百分比
const progressPercent = computed(() => {
  if (!currentTask.value) return 0
  const completed = currentTask.value.success_count + currentTask.value.failed_count
  return Math.round((completed / currentTask.value.total_count) * 100)
})

// 组件卸载时清理
onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">批量分析</h1>

      <!-- 输入区域 -->
      <div v-if="!currentTask" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            输入链接（每行一个，最多10个）
          </label>
          <textarea
            v-model="urlsText"
            rows="8"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="https://www.xiaohongshu.com/explore/xxx1
https://www.xiaohongshu.com/explore/xxx2
https://www.xiaohongshu.com/explore/xxx3"
          ></textarea>
          <p class="mt-2 text-sm text-gray-500">
            已识别 {{ parsedUrls.length }} 个有效链接
          </p>
        </div>

        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <button
          @click="handleSubmit"
          :disabled="isSubmitting || parsedUrls.length === 0"
          class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? '提交中...' : '开始批量分析' }}
        </button>
      </div>

      <!-- 进度区域 -->
      <div v-else class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">任务进度</h2>
          <span 
            class="px-3 py-1 rounded-full text-sm font-medium"
            :class="{
              'bg-yellow-100 text-yellow-800': currentTask.status === 'processing',
              'bg-green-100 text-green-800': currentTask.status === 'completed',
              'bg-red-100 text-red-800': currentTask.status === 'failed'
            }"
          >
            {{ currentTask.status === 'processing' ? '处理中' : 
               currentTask.status === 'completed' ? '已完成' : '失败' }}
          </span>
        </div>

        <!-- 进度条 -->
        <div class="mb-6">
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>{{ currentTask.success_count + currentTask.failed_count }} / {{ currentTask.total_count }}</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-blue-600 transition-all duration-500"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- 统计 -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">{{ currentTask.total_count }}</div>
            <div class="text-sm text-gray-500">总数</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ currentTask.success_count }}</div>
            <div class="text-sm text-gray-500">成功</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{{ currentTask.failed_count }}</div>
            <div class="text-sm text-gray-500">失败</div>
          </div>
        </div>

        <!-- 项目列表 -->
        <div v-if="currentTask.projects && currentTask.projects.length > 0" class="mb-6">
          <h3 class="text-sm font-medium text-gray-700 mb-3">处理结果</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div 
              v-for="project in currentTask.projects" 
              :key="project.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1 min-w-0 mr-4">
                <p class="text-sm text-gray-900 truncate">{{ project.source_url }}</p>
              </div>
              <span 
                class="flex-shrink-0 px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-yellow-100 text-yellow-800': project.status === 'draft',
                  'bg-green-100 text-green-800': project.status === 'analyzed',
                  'bg-red-100 text-red-800': project.status === 'failed'
                }"
              >
                {{ project.status === 'draft' ? '处理中' : 
                   project.status === 'analyzed' ? '成功' : '失败' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-4">
          <button
            v-if="currentTask.status !== 'processing'"
            @click="handleReset"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            继续分析
          </button>
          <router-link
            to="/history"
            class="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-center transition-colors"
          >
            查看历史记录
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
