<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { computed } from 'vue'

const route = useRoute()
const userStore = useUserStore()

const showNavbar = computed(() => {
  return route.name !== 'login' && userStore.isLoggedIn
})

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    window.location.href = '/login'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="showNavbar" class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex">
            <div class="flex flex-shrink-0 items-center">
              <span class="text-xl font-bold text-indigo-600">CopyCat</span>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <RouterLink 
                to="/" 
                class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                active-class="!border-indigo-500 !text-gray-900"
              >
                工作台
              </RouterLink>
              <RouterLink 
                to="/history" 
                class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                active-class="!border-indigo-500 !text-gray-900"
              >
                历史记录
              </RouterLink>
              <RouterLink 
                to="/profile" 
                class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                active-class="!border-indigo-500 !text-gray-900"
              >
                个人中心
              </RouterLink>
              <RouterLink 
                to="/settings" 
                class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                active-class="!border-indigo-500 !text-gray-900"
              >
                配置中心
              </RouterLink>
            </div>
          </div>
          <!-- 右侧：退出登录按钮 -->
          <div class="flex items-center">
            <button 
              @click="handleLogout" 
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg class="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <RouterView />
    </main>
  </div>
</template>
