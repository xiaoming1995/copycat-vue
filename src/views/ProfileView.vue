<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useHistoryStore } from '../stores/history'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const historyStore = useHistoryStore()

const { userInfo, preferences, membership } = storeToRefs(userStore)
const { history } = storeToRefs(historyStore)

// Stats
const totalAnalyses = computed(() => history.value.length)
const totalGenerations = computed(() => history.value.filter(h => h.generatedContent).length)

// Edit Mode
const isEditing = ref(false)
const editForm = ref({ ...userInfo.value })

const handleStartEdit = () => {
  editForm.value = { ...userInfo.value }
  isEditing.value = true
}

const handleSaveProfile = async () => {
  const result = await userStore.updateProfile({ nickname: editForm.value.name })
  if (result.success) {
    isEditing.value = false
    alert('资料已保存')
  } else {
    alert(result.message)
  }
}

const handleCancelEdit = () => {
  isEditing.value = false
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    window.location.href = '/login'
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 py-10">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      
      <!-- Profile Header -->
      <div class="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 transition-all hover:shadow-2xl">
        <!-- Background Pattern -->
        <div class="absolute inset-0 h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-90"></div>
        <div class="absolute inset-0 h-32 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        
        <div class="relative px-6 pb-8 pt-24 sm:px-10">
          <div class="flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
            <!-- Avatar -->
            <div class="relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-white shadow-lg sm:-mt-16 sm:h-32 sm:w-32">
              <span class="text-4xl font-bold text-indigo-600 select-none">{{ userInfo.name.charAt(0).toUpperCase() }}</span>
              <div class="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-400 ring-4 ring-white" title="Online"></div>
            </div>
            
            <!-- User Info -->
            <div class="mt-6 flex-1 text-center sm:mt-0 sm:text-left">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">{{ userInfo.name }}</h1>
                  <p class="text-sm font-medium text-indigo-600">{{ userInfo.title }}</p>
                </div>
                <div v-if="!isEditing" class="mt-4 sm:mt-0">
                  <button
                    @click="handleStartEdit"
                    class="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    <svg class="-ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    编辑资料
                  </button>
                </div>
              </div>
              
              <!-- Bio -->
              <p class="mt-4 max-w-2xl text-sm text-gray-500">{{ userInfo.bio }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Form (Inline Expansion) -->
      <div v-if="isEditing" class="mt-6 overflow-hidden rounded-xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5 animate-fade-in-down">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">编辑个人资料</h3>
          <button @click="handleCancelEdit" class="text-gray-400 hover:text-gray-500">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <div class="group">
            <label class="block text-sm font-medium leading-6 text-gray-900">昵称</label>
            <div class="mt-2">
              <input v-model="editForm.name" type="text" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">职位/头衔</label>
            <div class="mt-2">
              <input v-model="editForm.title" type="text" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow">
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium leading-6 text-gray-900">个人简介</label>
            <div class="mt-2">
              <textarea v-model="editForm.bio" rows="3" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-shadow"></textarea>
            </div>
            <p class="mt-2 text-xs text-gray-500">简短介绍一下你自己，这将展示在你的个人主页上。</p>
          </div>
        </div>
        <div class="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-900/10 pt-6">
          <button @click="handleCancelEdit" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">取消</button>
          <button @click="handleSaveProfile" class="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-95">保存修改</button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div class="relative overflow-hidden rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5 transition-all hover:-translate-y-1 hover:shadow-lg">
          <dt class="flex items-center gap-x-3 text-sm font-medium text-gray-500">
            <div class="rounded-md bg-indigo-50 p-2 ring-1 ring-indigo-100">
              <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            总拆解次数
          </dt>
          <dd class="mt-4 flex items-baseline gap-x-2">
            <span class="text-4xl font-bold tracking-tight text-gray-900">{{ totalAnalyses }}</span>
            <span class="text-sm text-gray-400">篇</span>
          </dd>
        </div>
        
        <div class="relative overflow-hidden rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-900/5 transition-all hover:-translate-y-1 hover:shadow-lg">
          <dt class="flex items-center gap-x-3 text-sm font-medium text-gray-500">
            <div class="rounded-md bg-purple-50 p-2 ring-1 ring-purple-100">
              <svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            生成文案数
          </dt>
          <dd class="mt-4 flex items-baseline gap-x-2">
            <span class="text-4xl font-bold tracking-tight text-gray-900">{{ totalGenerations }}</span>
            <span class="text-sm text-gray-400">个</span>
          </dd>
        </div>

        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
          <dt class="flex items-center gap-x-3 text-sm font-medium text-indigo-100">
            <div class="rounded-md bg-white/10 p-2 ring-1 ring-white/20">
              <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            会员状态
          </dt>
          <dd class="mt-4">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold tracking-tight text-white">{{ membership.plan }}</span>
              <span class="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/30">
                有效期至 12/31
              </span>
            </div>
          </dd>
        </div>
      </div>

      <!-- Settings & Other Sections -->
      <div class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Account Settings -->
        <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div class="border-b border-gray-900/5 px-6 py-4">
            <h3 class="text-base font-semibold leading-7 text-gray-900">账户设置</h3>
          </div>
          <div class="p-6">
            <ul role="list" class="space-y-6">
              <li class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900">邮件通知</span>
                  <span class="text-xs text-gray-500">接收分析完成和周报通知</span>
                </div>
                <button 
                  type="button" 
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                  :class="preferences.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'"
                  @click="preferences.emailNotifications = !preferences.emailNotifications"
                >
                  <span 
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </li>
              <li class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900">营销邮件</span>
                  <span class="text-xs text-gray-500">接收产品更新和优惠信息</span>
                </div>
                <button 
                  type="button" 
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                  :class="preferences.marketingEmails ? 'bg-indigo-600' : 'bg-gray-200'"
                  @click="preferences.marketingEmails = !preferences.marketingEmails"
                >
                  <span 
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="preferences.marketingEmails ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </li>
            </ul>
          </div>
          <div class="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-900/5">
             <button @click="handleLogout" class="flex items-center text-sm font-medium text-red-600 hover:text-red-500 transition-colors">
               <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
               </svg>
               退出登录
             </button>
          </div>
        </div>

        <!-- Help & Support -->
        <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div class="border-b border-gray-900/5 px-6 py-4">
            <h3 class="text-base font-semibold leading-7 text-gray-900">帮助与支持</h3>
          </div>
          <div class="p-6">
            <ul role="list" class="space-y-2">
              <li>
                <a href="#" class="group flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                  <div class="flex items-center">
                    <div class="mr-3 rounded-full bg-indigo-50 p-1.5 text-indigo-600 group-hover:bg-indigo-100">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-900">使用指南</span>
                  </div>
                  <span class="text-gray-400 group-hover:text-gray-500">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
                  </span>
                </a>
              </li>
              <li>
                <a href="#" class="group flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                  <div class="flex items-center">
                    <div class="mr-3 rounded-full bg-indigo-50 p-1.5 text-indigo-600 group-hover:bg-indigo-100">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-900">联系客服</span>
                  </div>
                  <span class="text-gray-400 group-hover:text-gray-500">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
                  </span>
                </a>
              </li>
              <li>
                <a href="#" class="group flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                  <div class="flex items-center">
                    <div class="mr-3 rounded-full bg-indigo-50 p-1.5 text-indigo-600 group-hover:bg-indigo-100">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-900">反馈建议</span>
                  </div>
                  <span class="text-gray-400 group-hover:text-gray-500">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-down {
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
