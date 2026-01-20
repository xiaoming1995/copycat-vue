<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 模式切换：登录/注册
const isRegisterMode = ref(false)

// 表单数据
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 切换模式
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  errorMsg.value = ''
  successMsg.value = ''
  password.value = ''
  confirmPassword.value = ''
}

// 登录
const handleLogin = async () => {
  errorMsg.value = ''
  
  if (!email.value || !password.value) {
    errorMsg.value = '请输入邮箱和密码'
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await userStore.login({
      email: email.value,
      password: password.value
    })
    
    if (result.success) {
      // 使用 window.location 强制页面刷新，确保状态正确加载
      window.location.href = '/'
    } else {
      errorMsg.value = result.message
    }
  } catch (error) {
    errorMsg.value = '登录失败，请稍后重试'
    console.error('登录错误:', error)
  } finally {
    isLoading.value = false
  }
}

// 注册
const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!email.value || !password.value) {
    errorMsg.value = '请输入邮箱和密码'
    return
  }
  
  if (password.value.length < 6) {
    errorMsg.value = '密码长度至少6位'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await userStore.register({
      email: email.value,
      password: password.value,
      nickname: nickname.value || email.value.split('@')[0]
    })
    
    if (result.success) {
      successMsg.value = '注册成功！请登录'
      isRegisterMode.value = false
      password.value = ''
      confirmPassword.value = ''
    } else {
      errorMsg.value = result.message
    }
  } catch (error) {
    errorMsg.value = '注册失败，请稍后重试'
    console.error('注册错误:', error)
  } finally {
    isLoading.value = false
  }
}

// 提交表单
const handleSubmit = () => {
  if (isRegisterMode.value) {
    handleRegister()
  } else {
    handleLogin()
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">CopyCat</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ isRegisterMode ? '创建您的账户，开启爆款文案创作之旅' : '登录您的账户，开启爆款文案创作之旅' }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- 昵称（仅注册时显示） -->
          <div v-if="isRegisterMode">
            <label for="nickname" class="block text-sm font-medium text-gray-700">昵称（可选）</label>
            <div class="mt-1">
              <input
                id="nickname"
                name="nickname"
                type="text"
                v-model="nickname"
                placeholder="不填则使用邮箱前缀"
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 邮箱 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">邮箱地址</label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="email"
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 密码 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
            <div class="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
                required
                v-model="password"
                :placeholder="isRegisterMode ? '至少6位字符' : ''"
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 确认密码（仅注册时显示） -->
          <div v-if="isRegisterMode">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">确认密码</label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                v-model="confirmPassword"
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 成功消息 -->
          <div v-if="successMsg" class="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            {{ successMsg }}
          </div>

          <!-- 错误消息 -->
          <div v-if="errorMsg" class="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {{ errorMsg }}
          </div>

          <!-- 提交按钮 -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="isLoading"
                class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? (isRegisterMode ? '注册中...' : '登录中...') : (isRegisterMode ? '注册' : '登录') }}
            </button>
          </div>
        </form>

        <!-- 切换登录/注册 -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-2 text-gray-500">{{ isRegisterMode ? '已有账号？' : '没有账号？' }}</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-3">
            <button
              type="button"
              @click="toggleMode"
              class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {{ isRegisterMode ? '返回登录' : '立即注册' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
